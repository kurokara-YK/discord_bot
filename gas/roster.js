/****************************************************
 * roster.gs
 * ==================================================
 * 当番表の読み取り・判定・文面の組み立て
 *
 * 【送信済みの管理】
 * 通知を送った回は，当番表の「通知済み」列にチェックが入る。
 * チェックが入っている回は，次回以降 送信対象にならない。
 *
 * シート上で送信状況が一目で分かり，
 * もう一度送りたい回はチェックを外すだけでよい。
 ****************************************************/

// ---------------------------------------------------
// シートを開く
// ---------------------------------------------------

function openSpreadsheet_(settings) {
  if (!settings.spreadsheetId || isPlaceholder_(settings.spreadsheetId)) {
    throw new Error(
      "spreadsheetId が未設定です。config_roster.js に当番表のURLを設定してください。" +
      "当番表がまだ無い場合は create_roster_spreadsheet を実行してください。"
    );
  }

  return SpreadsheetApp.openById(settings.spreadsheetId);
}

function openSheet_(settings, sheetName, settingKey) {
  const sheet = openSpreadsheet_(settings).getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(
      "シートが見つかりません: " + sheetName +
      " / config_roster.js の " + settingKey + " と，実際のタブ名が一致しているか確認してください。"
    );
  }

  return sheet;
}

function openRosterSheet_(settings) {
  return openSheet_(settings, settings.rosterSheetName, "rosterSheetName");
}

function openMemberSheet_(settings) {
  return openSheet_(settings, settings.memberSheetName, "memberSheetName");
}

// ---------------------------------------------------
// 読み取り
// ---------------------------------------------------

// 当番表を読み込み，1行を1件のオブジェクトにして返す。
function getEntries_(settings) {
  const sheet = openRosterSheet_(settings);
  const columns = resolveColumns_(settings.assigneeColumnCount);
  const lastRow = sheet.getLastRow();

  if (lastRow < ROW.DATA_START) {
    return [];
  }

  const values = sheet
    .getRange(ROW.DATA_START, 1, lastRow - ROW.DATA_START + 1, columns.totalColumnCount)
    .getValues();

  return values.map(function(row, offset) {
    const dutyDate = toDate_(row[columns.dutyDateIndex], settings.fiscalYear);
    const noticeDate = resolveNoticeDate_(row[columns.noticeDateIndex], dutyDate, settings);

    const assigneeNames = row
      .slice(columns.assigneeFromIndex, columns.assigneeFromIndex + columns.assigneeCount)
      .filter(function(v) { return !isEmptyCell_(v); })
      .map(normalizeName_)
      .filter(function(name) { return name !== ""; });

    return {
      rowNumber: ROW.DATA_START + offset,
      no: row[columns.noIndex],
      dutyDate: dutyDate,
      noticeDate: noticeDate,
      assigneeNames: assigneeNames,
      content: isEmptyCell_(row[columns.contentIndex])
        ? "" : String(row[columns.contentIndex]).trim(),
      isSent: row[columns.sentIndex] === true
    };
  });
}

// その行の通知日を決める。
// 通知日が空なら，担当日から noticeOffsetDays を引いた日で補う。
function resolveNoticeDate_(noticeValue, dutyDate, settings) {
  const noticeDate = toDate_(noticeValue, settings.fiscalYear);

  if (noticeDate !== null) {
    return noticeDate;
  }

  return dutyDate === null ? null : addDays_(dutyDate, -settings.noticeOffsetDays);
}

// 名簿から 名前 → Discord ID の対応表を作る。
function getMemberMap_(settings) {
  const sheet = openMemberSheet_(settings);
  const lastRow = sheet.getLastRow();
  const map = {};

  if (lastRow < MEMBER_ROW.DATA_START) {
    return map;
  }

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

// ---------------------------------------------------
// 判定
// ---------------------------------------------------

// 今日送るべき回を選ぶ。
function selectTargets_(settings, entries, today) {
  const todayKey = toDateKey_(today);
  const targets = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];

    // すでに通知済みの回。
    if (entry.isSent) {
      continue;
    }

    // 日付が入っていない行。予定が未定のため飛ばす。
    if (entry.noticeDate === null) {
      continue;
    }

    const noticeKey = toDateKey_(entry.noticeDate);

    // 通知日がまだ来ていない。表は日付順に並ぶ前提のため，ここで止める。
    if (noticeKey > todayKey) {
      break;
    }

    // 担当者も内容も無い回は，送るものが無い。
    if (entry.assigneeNames.length === 0 && entry.content === "") {
      continue;
    }

    targets.push(entry);
  }

  return targets;
}

// 通知済みのチェックを入れる。
function markAsSent_(settings, rowNumber) {
  const sheet = openRosterSheet_(settings);
  const columns = resolveColumns_(settings.assigneeColumnCount);

  sheet.getRange(rowNumber, columns.sentNumber).setValue(true);
}

// ---------------------------------------------------
// 文面
// ---------------------------------------------------

// 判定結果から Discord 本文を作る。
function buildMessage_(settings, target, memberMap) {
  const messages = settings.messages;
  const values = {
    content: target.content,
    dutyDate: formatDate_(target.dutyDate, settings.fiscalYear),
    assignees: ""
  };

  // 担当者がいない回は，内容だけのイベント通知にする。
  if (target.assigneeNames.length === 0) {
    return applyTemplate_(messages.eventMessageTemplate, values);
  }

  values.assignees = target.assigneeNames
    .map(function(name) { return buildMention_(settings, name, memberMap); })
    .join(messages.assigneeSeparator);

  let message = applyTemplate_(messages.assigneeMessageTemplate, values);

  if (target.content !== "") {
    message += applyTemplate_(messages.contentSuffixTemplate, values);
  }

  return message;
}

// 担当者名から Discord のメンションを作る。
function buildMention_(settings, name, memberMap) {
  const discordId = memberMap[normalizeName_(name)];

  if (!isValidDiscordId_(discordId)) {
    return applyTemplate_(settings.messages.unknownMemberTemplate, { name: name });
  }

  return "<@" + String(discordId).trim() + ">";
}

// Discord のユーザーIDとして使えるか。IDは数字だけの文字列。
function isValidDiscordId_(value) {
  return !isEmptyCell_(value) && /^\d+$/.test(String(value).trim());
}

// 名簿に ID が無い担当者を集める。
function collectUnknownMembers_(entries, memberMap) {
  const unknown = [];

  entries.forEach(function(entry) {
    entry.assigneeNames.forEach(function(name) {
      const key = normalizeName_(name);

      if (!isValidDiscordId_(memberMap[key]) && unknown.indexOf(key) < 0) {
        unknown.push(key);
      }
    });
  });

  return unknown;
}
