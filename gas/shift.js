/****************************************************
 * shift.gs
 * ==================================================
 * シフト表の読み取り・判定
 *
 * 【送信済みの管理】
 * 事前通知はコマに属するのでシフト表の「通知済み」で，
 * 「今日の予定」「お疲れさま」は日に属するので
 * 日程シートの「送信済」で管理する。
 *
 * 事前通知は1コマに複数回あるため，どこまで送ったかは
 * スクリプトプロパティに持ち，すべて送り終えると
 * シートにチェックが入る。チェックを外せば送り直せる。
 *
 * 【通知しない，の判定】
 * 次の順で見て，1つでも止まっていれば送らない。
 *   1. 日程シートの「通知を停止」
 *   2. シフト表の「通知しない」
 * どちらもシート側にあるのは，当日その場で切り替えるため。
 ****************************************************/

// ---------------------------------------------------
// シートを開く
// ---------------------------------------------------

function openSpreadsheet_(settings) {
  if (!isSpreadsheetReady_(settings)) {
    throw new Error(
      "シフト表がまだありません。次の順で進めてください。" +
      "(1) create_shift_spreadsheet を実行する " +
      "(2) 実行ログに出たURLを config_shift.js の spreadsheetId に貼る " +
      "(3) もう一度この関数を実行する"
    );
  }

  return SpreadsheetApp.openById(settings.spreadsheetId);
}

// シフト表のURLが設定されているか。
//
// トリガーは15分おきに動くため，シートを作る前でも呼ばれる。
// そのたびに例外を投げると実行ログがエラーで埋まり，
// Apps Script から「失敗が続いている」という通知も届く。
// 準備がまだなだけなので，エラーではなく静かに終える。
function isSpreadsheetReady_(settings) {
  return Boolean(settings.spreadsheetId) && !isPlaceholder_(settings.spreadsheetId);
}

function openSheet_(settings, sheetName, settingKey) {
  const sheet = openSpreadsheet_(settings).getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(
      "シートが見つかりません: " + sheetName +
      " / config_shift.js の " + settingKey + " と，実際のタブ名が一致しているか確認してください。"
    );
  }

  return sheet;
}

function openScheduleSheet_(settings) {
  return openSheet_(settings, settings.scheduleSheetName, "scheduleSheetName");
}

function openShiftSheet_(settings) {
  return openSheet_(settings, settings.shiftSheetName, "shiftSheetName");
}

function openMemberSheet_(settings) {
  return openSheet_(settings, settings.memberSheetName, "memberSheetName");
}

// ---------------------------------------------------
// 読み取り
// ---------------------------------------------------

// シフト表を1行1件のコマ枠にして返す。
function getSlots_(settings) {
  const sheet = openShiftSheet_(settings);
  const columns = resolveColumns_(settings.assigneeColumnCount);
  const lastRow = sheet.getLastRow();

  if (lastRow < ROW.DATA_START) {
    return [];
  }

  const values = sheet
    .getRange(ROW.DATA_START, 1, lastRow - ROW.DATA_START + 1, columns.totalColumnCount)
    .getValues();

  return values.map(function(row, offset) {
    const date = toDate_(row[columns.dateIndex], settings.fiscalYear);

    // 時と分を合わせて「0時からの分数」にする。
    const startMinutes = buildMinutesOfDay_(
      row[columns.startHourIndex], row[columns.startMinuteIndex]
    );
    const endMinutes = buildMinutesOfDay_(
      row[columns.endHourIndex], row[columns.endMinuteIndex]
    );

    const assigneeNames = row
      .slice(columns.assigneeFromIndex, columns.assigneeFromIndex + columns.assigneeCount)
      .filter(function(v) { return !isEmptyCell_(v); })
      .map(normalizeName_)
      .filter(function(name) { return name !== ""; });

    return {
      rowNumber: ROW.DATA_START + offset,
      no: row[columns.noIndex],
      date: date,
      dateKey: date === null ? null : toDateKey_(date, settings.fiscalYear),
      startMinutes: startMinutes,
      endMinutes: endMinutes,
      startAt: buildDateTime_(date, startMinutes),
      endAt: buildDateTime_(date, endMinutes),
      assigneeNames: assigneeNames,
      memo: isEmptyCell_(row[columns.memoIndex]) ? "" : String(row[columns.memoIndex]).trim(),
      isSkipped: toBoolean_(row[columns.skipIndex]),
      isSent: toBoolean_(row[columns.sentIndex])
    };
  });
}

// 名簿を読む。名前 → Discord ID の対応表を作る。
function getMemberMap_(settings) {
  const sheet = openMemberSheet_(settings);
  const lastRow = sheet.getLastRow();
  const map = {};

  if (lastRow < MEMBER_ROW.DATA_START) {
    return map;
  }

  // Discord ID は18桁前後の数字。数値として読むと桁が落ちるため表示値で読む。
  sheet
    .getRange(MEMBER_ROW.DATA_START, 1, lastRow - MEMBER_ROW.DATA_START + 1, 2)
    .getDisplayValues()
    .forEach(function(row) {
      const name = normalizeName_(row[0]);

      if (name !== "") {
        map[name] = String(row[1] || "").trim();
      }
    });

  return map;
}

// 全体の通知停止スイッチが入っているか。
// 全体の通知停止スイッチが入っているか。
// 行数が変わっても見つけられるよう，ラベルを探して読む。
function isPaused_(settings) {
  const sheet = openScheduleSheet_(settings);
  const lastRow = sheet.getLastRow();

  if (lastRow < ROW.DATA_START) {
    return false;
  }

  const labels = sheet
    .getRange(ROW.DATA_START, 1, lastRow - ROW.DATA_START + 1, 2)
    .getValues();

  for (let i = 0; i < labels.length; i += 1) {
    if (String(labels[i][0]).trim() === PAUSE_LABEL) {
      return toBoolean_(labels[i][1]);
    }
  }

  return false;
}

// ---------------------------------------------------
// 判定
// ---------------------------------------------------

// いま送るべき事前通知を選ぶ。
//
// 「コマ開始の n分前」に近いかを見る。トリガーは時刻ちょうどには
// 動かないため，toleranceMinutes の幅を持たせて取りこぼしを防ぐ。
//
// 戻り値は { slot, minutes, isImminent } の配列。
// isImminent は最後の事前通知かどうかで，交代の案内を出す判断に使う。
function selectNoticeTargets_(settings, slots, now) {
  const notifications = settings.notifications;
  const tolerance = notifications.toleranceMinutes;
  const lastMinutes = notifications.beforeMinutes[notifications.beforeMinutes.length - 1];
  const log = getNoticeLog_();
  const targets = [];

  slots.forEach(function(slot) {
    // 日付や時刻が読めない行。書きかけとみなして飛ばす。
    if (slot.startAt === null) {
      return;
    }

    // 終了が開始より前の行。書き間違いとみなして飛ばす。
    // そのまま扱うと通知の時刻がおかしくなる。
    if (slot.endMinutes !== null && slot.endMinutes <= slot.startMinutes) {
      return;
    }

    // この枠だけ通知しない設定。
    if (slot.isSkipped) {
      return;
    }

    // 「通知済み」のチェックが入っている枠。
    // 人が手で入れた場合も送らない。送り直したいときは外してもらう。
    if (slot.isSent) {
      return;
    }

    // 担当者が1人もいない枠は，送る相手がいない。
    if (slot.assigneeNames.length === 0) {
      return;
    }

    const untilStart = diffMinutes_(now, slot.startAt);

    notifications.beforeMinutes.forEach(function(minutes) {
      // すでに送ったタイミング。
      if (isNoticeSent_(log, slot, minutes)) {
        return;
      }

      // 「n分前」から toleranceMinutes 以内か。
      // 過去側にも幅を取る。トリガーが遅れて動くことがあるため。
      if (Math.abs(untilStart - minutes) > tolerance) {
        return;
      }

      targets.push({
        slot: slot,
        minutes: minutes,
        isImminent: minutes === lastMinutes
      });
    });
  });

  return targets;
}

// ひとつ前のコマに入っている人を集める。
// 同じ日で，終了時刻がこの枠の開始時刻と重なる行すべてから取る。
//
// 前のコマが複数行に分かれていることがあるため，1件で止めない。
// 同じ人が重複しないようにまとめる。
function collectPreviousAssignees_(slots, target) {
  const names = [];

  slots.forEach(function(slot) {
    if (slot.rowNumber === target.rowNumber || slot.dateKey === null) {
      return;
    }

    if (slot.dateKey !== target.dateKey || slot.isSkipped) {
      return;
    }

    if (slot.endMinutes !== target.startMinutes) {
      return;
    }

    slot.assigneeNames.forEach(function(name) {
      const key = normalizeName_(name);

      if (names.indexOf(key) < 0) {
        names.push(key);
      }
    });
  });

  return names;
}

// その日にシフトへ入っている人を，重複なく集める。
// 業務終了の通知でお礼を言う相手になる。
function collectDayAssignees_(slots, dateKey) {
  const names = [];

  slots.forEach(function(slot) {
    if (slot.dateKey !== dateKey || slot.isSkipped) {
      return;
    }

    slot.assigneeNames.forEach(function(name) {
      const key = normalizeName_(name);

      if (names.indexOf(key) < 0) {
        names.push(key);
      }
    });
  });

  return names;
}

// いま「今日の予定」を送るときか。
function shouldSendSummary_(day, now) {
  return shouldSendDayNotice_(day, now, day.summaryMinutes, day.isSummarySent);
}

// いま「お疲れさま」を送るときか。
function shouldSendClosing_(day, now) {
  return shouldSendDayNotice_(day, now, day.closingMinutes, day.isClosingSent);
}

// 日に対する通知を，いま送るときかどうか。
// 「時刻を過ぎたか」で見るため，トリガーが遅れても送られる。
function shouldSendDayNotice_(day, now, noticeMinutes, isSent) {
  if (isSent || noticeMinutes === null || day.dateKey === null) {
    return false;
  }

  // 今日の行だけを見る。過ぎた日をまとめて送らないようにするため。
  if (day.dateKey !== Utilities.formatDate(now, TIME_ZONE, "yyyy-MM-dd")) {
    return false;
  }

  return now.getHours() * 60 + now.getMinutes() >= noticeMinutes;
}

// その日のコマ枠を，人ごとにまとめる。
// コマ順に並べると自分の出番を探すのに全部読むことになるため。
function groupSlotsByPerson_(slots, dateKey) {
  const people = [];
  const index = {};

  slots.forEach(function(slot) {
    if (slot.dateKey !== dateKey || slot.isSkipped) {
      return;
    }

    if (slot.assigneeNames.length === 0 || slot.startAt === null) {
      return;
    }

    // 同じ人が同じ行の複数列に入っていることがある。
    // その場合もコマは1つなので，重複して数えない。
    const seen = [];

    slot.assigneeNames.forEach(function(name) {
      const key = normalizeName_(name);

      if (seen.indexOf(key) >= 0) {
        return;
      }

      seen.push(key);

      if (!Object.prototype.hasOwnProperty.call(index, key)) {
        index[key] = people.length;
        people.push({ name: key, slots: [] });
      }

      people[index[key]].slots.push(slot);
    });
  });

  // 早い時間の人から並べる。
  people.forEach(function(person) {
    person.slots.sort(function(a, b) { return a.startMinutes - b.startMinutes; });
  });

  people.sort(function(a, b) {
    return a.slots[0].startMinutes - b.slots[0].startMinutes;
  });

  return people;
}

// ---------------------------------------------------
// 書き込み
// ---------------------------------------------------

// 事前通知を送ったことを記録する。
// すべてのタイミングを送り終えたときだけ，シートにチェックを入れる。
function markNoticeAsSent_(settings, slot, minutes) {
  const log = getNoticeLog_();
  log[buildNoticeKey_(slot, minutes)] = true;

  // 残りのタイミングがあるか調べる。
  const remaining = settings.notifications.beforeMinutes.filter(function(m) {
    return !isNoticeSent_(log, slot, m);
  });

  saveNoticeLog_(log);

  if (remaining.length === 0) {
    const sheet = openShiftSheet_(settings);
    const columns = resolveColumns_(settings.assigneeColumnCount);

    sheet.getRange(slot.rowNumber, columns.sentNumber).setValue(true);
  }
}

// ---------------------------------------------------
// 事前通知の送信記録
// ---------------------------------------------------

const NOTICE_LOG_KEY = "sentNotices";

function buildNoticeKey_(slot, minutes) {
  return [slot.dateKey, slot.startMinutes, slot.rowNumber, minutes].join("|");
}

function getNoticeLog_() {
  const raw = PropertiesService.getScriptProperties().getProperty(NOTICE_LOG_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    // 壊れていたら記録が無いものとして扱う。止めると通知が送れなくなる。
    Logger.log("警告: 事前通知の記録が読めませんでした。記録を作り直します。");
    return {};
  }
}

function saveNoticeLog_(log) {
  PropertiesService.getScriptProperties()
    .setProperty(NOTICE_LOG_KEY, JSON.stringify(log));
}

function isNoticeSent_(log, slot, minutes) {
  return log[buildNoticeKey_(slot, minutes)] === true;
}

// 「通知済み」のチェックが外された枠の記録を消す。
// 外すだけで送り直せるよう，通知を送る前に食い違いを直す。
function clearNoticeLogForUnchecked_(settings, slots) {
  const log = getNoticeLog_();
  let changed = false;

  slots.forEach(function(slot) {
    if (slot.isSent || slot.dateKey === null) {
      return;
    }

    settings.notifications.beforeMinutes.forEach(function(minutes) {
      const key = buildNoticeKey_(slot, minutes);

      // シートは未送信なのに記録が残っている＝人が外したので消す。
      if (log[key] === true) {
        delete log[key];
        changed = true;
      }
    });
  });

  if (changed) {
    saveNoticeLog_(log);
  }
}
