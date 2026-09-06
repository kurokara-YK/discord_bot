/****************************************************
 * main.gs
 * ==================================================
 * エントリーポイント
 *
 * Apps Script の「実行する関数」に出るのは，このファイルの関数だけ。
 * 末尾が _ の関数は内部用のため一覧に出ない。
 *
 * 【使う順番】
 *   1. create_shift_spreadsheet … 最初の1回だけ。シートを作る
 *   2. 日程シートに，その日が何の日かと時刻を書く
 *   3. 名簿に名前と Discord ID を入れる
 *   4. シフト表を埋める（日付・時刻・担当者はプルダウン）
 *   5. setup_triggers           … 通知のトリガーを登録する
 ****************************************************/

// 通知を送る。決めた間隔のトリガーにこの関数を設定する。
//
// 実行するたび「いま送るものはあるか」を判定し，あれば送る。
//   今日の予定 … 日程シートの「予定を送る」時刻を過ぎたら
//   事前通知   … コマ開始の n分前（config の beforeMinutes）
//   お疲れさま … 日程シートの「お疲れさまを送る」時刻を過ぎたら
//
// どれも「時刻を過ぎたか」で判定するため，トリガーが遅れても送られる。
function shift_reminder_main() {
  const settings = getSettings_();
  const now = new Date();

  Logger.log("=== " + settings.label + " ===");

  // シートを作る前でもトリガーは動く。まだなら何もせず終える。
  if (!isSpreadsheetReady_(settings)) {
    Logger.log(
      "シフト表がまだありません。create_shift_spreadsheet を実行し，" +
      "出てきたURLを config_shift.js の spreadsheetId に貼ってください。"
    );
    return;
  }

  if (isPaused_(settings)) {
    Logger.log("日程シートの「" + PAUSE_LABEL + "」が入っています。通知を送りません。");
    return;
  }

  const slots = getSlots_(settings);

  // チェックを外した枠は記録も消し，送り直せるようにする。
  clearNoticeLogForUnchecked_(settings, slots);

  const targets = selectNoticeTargets_(settings, slots, now);

  // 今日の行だけを見る。日程シートは1日1行のため多くても1件。
  const today = getScheduleDays_(settings).filter(function(day) {
    return shouldSendSummary_(day, now) || shouldSendClosing_(day, now);
  });

  if (targets.length === 0 && today.length === 0) {
    Logger.log("いま送る通知はありません。");
    return;
  }

  // 名簿と Webhook は，送るものがあると分かってから読む。
  const memberMap = getMemberMap_(settings);
  const webhookUrl = getWebhookUrl_(settings);

  // 1日の流れと同じ順に並ぶよう，今日の予定を先に送る。
  today.forEach(function(day) {
    if (shouldSendSummary_(day, now)) {
      sendDaySummary_(settings, slots, day, memberMap, webhookUrl);
    }
  });

  targets.forEach(function(target) {
    sendNotice_(settings, slots, target, memberMap, webhookUrl);
  });

  today.forEach(function(day) {
    if (shouldSendClosing_(day, now)) {
      sendClosingNotice_(settings, slots, day, memberMap, webhookUrl);
    }
  });
}

// 事前通知を1件送る。
function sendNotice_(settings, slots, target, memberMap, webhookUrl) {
  // 交代の引き継ぎ相手。直前の通知でだけ使う。
  const previousNames = target.isImminent && settings.notifications.includeCurrentShift
    ? collectPreviousAssignees_(slots, target.slot)
    : [];

  const dayLabel = buildDayLabel_(getDayInfoMap_(settings)[target.slot.dateKey]);

  send_discord(
    webhookUrl, buildNoticeMessage_(settings, target, dayLabel, previousNames, memberMap)
  );

  // 送信に成功してから記録する。先に記録すると，失敗時に送られないまま済みになる。
  markNoticeAsSent_(settings, target.slot, target.minutes);

  Logger.log(
    "事前通知を送信しました。" +
    formatDate_(target.slot.date, settings.fiscalYear) + " " +
    buildTimeRange_(target.slot) +
    " / " + target.minutes + "分前"
  );
}

// 今日の予定を送る。その日のシフトを人ごとにまとめて1通で。
function sendDaySummary_(settings, slots, day, memberMap, webhookUrl) {
  const people = groupSlotsByPerson_(slots, day.dateKey);

  if (people.length === 0) {
    send_discord(webhookUrl, settings.messages.summaryEmptyTemplate);
    Logger.log("今日の予定: シフトが無い旨を送信しました。");
  } else {
    send_discord(
      webhookUrl,
      buildSummaryMessage_(settings, day.date, buildDayLabel_(day), people, memberMap)
    );
    Logger.log("今日の予定を送信しました。" + people.length + "人ぶん");
  }

  // 送り終えてからチェックを入れる。
  markScheduleAsSent_(settings, day.rowNumber, SCHEDULE_COL.SUMMARY_SENT.index);
}

// お疲れさまを送る。
function sendClosingNotice_(settings, slots, day, memberMap, webhookUrl) {
  const assignees = collectDayAssignees_(slots, day.dateKey);

  send_discord(
    webhookUrl,
    buildClosingMessage_(settings, day.date, buildDayLabel_(day), assignees, memberMap)
  );

  markScheduleAsSent_(settings, day.rowNumber, SCHEDULE_COL.CLOSING_SENT.index);

  Logger.log("お疲れさまを送信しました。担当 " + assignees.length + "人");
}

// スプレッドシートを新規作成する。最初の1回だけ実行すること。
function create_shift_spreadsheet() {
  const settings = getSettings_();
  const created = createSpreadsheet_(settings);

  Logger.log("シフト表を作成しました。");
  Logger.log("  ファイル名 : " + created.name);
  Logger.log("  作成先     : " + created.folderName);
  Logger.log("  URL        : " + created.url);
  Logger.log("");
  Logger.log("【次にすること】");
  Logger.log("  1. 上のURLを config_shift.js の spreadsheetId に貼り付ける");
  Logger.log("  2. 日程シートに日を書き，名簿とシフト表を埋める");
  Logger.log("  3. setup_triggers を実行する");
}

// 通知のトリガーを登録する。何度実行してもよい。
// 通知の時刻は日程シートに書くため，くり返しの1本でよい。
function setup_triggers() {
  const settings = getSettings_();
  const notifications = settings.notifications;

  // シートが無いのに登録すると，15分ごとに空振りし続ける。
  // 先に作ってもらう。
  if (!isSpreadsheetReady_(settings)) {
    Logger.log(
      "シフト表がまだありません。先に create_shift_spreadsheet を実行し，" +
      "出てきたURLを config_shift.js の spreadsheetId に貼ってください。"
    );
    return;
  }

  removeTriggers_();

  ScriptApp.newTrigger("shift_reminder_main")
    .timeBased()
    .everyMinutes(notifications.triggerMinutes)
    .create();

  Logger.log(
    "トリガーを登録しました。shift_reminder_main : " +
    notifications.triggerMinutes + "分おき"
  );
  Logger.log("");
  Logger.log("  事前通知     : " + notifications.beforeMinutes.join("分前, ") + "分前");
  Logger.log("  今日の予定   : 日程シートの「予定を送る」時刻");
  Logger.log("  お疲れさま   : 日程シートの「お疲れさまを送る」時刻");

  warnIfTriggerTooCoarse_(settings);
}

// トリガーの間隔が粗すぎないか確かめる。
// 分の刻みより粗いと，トリガーの動かない時刻に始まるコマが通知されない。
function warnIfTriggerTooCoarse_(settings) {
  const trigger = settings.notifications.triggerMinutes;
  const step = settings.minuteStep;

  if (trigger <= step) {
    return;
  }

  Logger.log("");
  Logger.log(
    "警告: トリガーの間隔（" + trigger + "分）が，分の刻み（" + step + "分）より粗いです。" +
    "トリガーの動かない時刻に始まるコマは通知されません。" +
    "config_shift.js の triggerMinutes を " + step + " 以下にするか，" +
    "minuteStep を " + trigger + " に合わせてください。"
  );
}

// このBOTが作ったトリガーを消す。二重に登録されると通知も二重に飛ぶ。
function removeTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "shift_reminder_main") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

// 名簿の「担当コマ数」の数式を入れ直す。この列が #REF! のときに使う。
function repair_member_formula() {
  const settings = getSettings_();

  // シフト表が開けることを確かめてから入れる。無いとまた #REF! になる。
  openShiftSheet_(settings);
  applyShiftCountFormula_(openMemberSheet_(settings), settings);

  Logger.log("名簿の「" + MEMBER_COL.SHIFT_COUNT.header + "」の数式を入れ直しました。");
}

// 事前通知の送信記録を消す。記録が食い違ったときの手当て。
// 「今日の予定」「お疲れさま」は日程シートの「送信済」を外す。
function reset_notices() {
  PropertiesService.getScriptProperties().deleteProperty(NOTICE_LOG_KEY);

  Logger.log("事前通知の送信記録を消しました。");
  Logger.log("送り直したい枠は，シフト表の「通知済み」のチェックも外してください。");
  Logger.log("「今日の予定」「お疲れさま」は，日程シートの「送信済」を外してください。");
}

// 設定と表の状態を確かめ，Discord へテスト送信する。
// うまく動かないときに使う。シフトの通知は送らない。
function check_settings() {
  const settings = getSettings_();

  Logger.log("=== " + settings.label + " / 設定の確認 ===");
  Logger.log("");

  // シートが無い段階でも状態を知りたいので，例外にせず案内を出す。
  if (!isSpreadsheetReady_(settings)) {
    Logger.log("[シート] まだ作られていません。");
    Logger.log("  create_shift_spreadsheet を実行し，出てきたURLを");
    Logger.log("  config_shift.js の spreadsheetId に貼り付けてください。");
    Logger.log("");
    Logger.log("[Webhook] " + (settings.webhookUrl.indexOf("https://") === 0
      ? "設定されています" : "未設定です"));
    return;
  }

  Logger.log("[通知のタイミング]");
  Logger.log("  事前通知   : " + settings.notifications.beforeMinutes.join("分前, ") + "分前");
  Logger.log("  交代の案内 : " + (settings.notifications.includeCurrentShift ? "する" : "しない"));
  Logger.log("  日の通知   : 日程シートの「予定を送る」「お疲れさまを送る」");
  Logger.log("  判定の幅   : 前後 " + settings.notifications.toleranceMinutes + "分");
  Logger.log("  トリガー   : " + settings.notifications.triggerMinutes + "分おき");
  Logger.log("  分の刻み   : " + settings.minuteStep + "分");
  Logger.log("");

  const days = getScheduleDays_(settings);
  Logger.log("[日程] " + days.length + "日");

  days.forEach(function(day) {
    Logger.log(
      "  " + formatDateWithWeekday_(day.date, settings.fiscalYear) + buildDayLabel_(day) +
      " / 予定 " + formatNoticeTime_(day.summaryMinutes, day.isSummarySent) +
      " / お疲れさま " + formatNoticeTime_(day.closingMinutes, day.isClosingSent)
    );
  });

  Logger.log("");

  const slots = getSlots_(settings);
  const memberMap = getMemberMap_(settings);

  Logger.log("[シフト表] " + slots.length + "行");
  Logger.log("  担当者なし : " + slots.filter(function(s) {
    return s.assigneeNames.length === 0;
  }).length + "行");
  Logger.log("  通知しない : " + slots.filter(function(s) { return s.isSkipped; }).length + "行");
  Logger.log("");

  Logger.log("[全体の停止] " + (isPaused_(settings) ? "止めています" : "動かします"));
  Logger.log("");

  reportMemberIssues_(settings, slots, memberMap);

  warnIfTriggerTooCoarse_(settings);
  warnIfShiftOutOfWorkHours_(settings, days, slots);
  Logger.log("");

  // つながるかは実際に送らないと分からないため，確認と一緒に済ませる。
  send_discord(
    getWebhookUrl_(settings),
    "【テスト送信】" + settings.label + " から送信しました。"
  );

  Logger.log("[Discord] テストメッセージを送信しました。チャンネルを確認してください。");
}

// 通知時刻と送信状況を実行ログ用の文字列にする。
function formatNoticeTime_(minutes, isSent) {
  if (minutes === null) {
    return "なし";
  }

  return formatMinutesOfDay_(minutes) + (isSent ? "（送信済）" : "");
}

// 作業時間の外にあるコマを実行ログへ出す。
//
// 作業終了より後にコマがあると，お疲れさまがシフトより先に届く。
// 日程シートの書き間違いに気づけるようにする。
function warnIfShiftOutOfWorkHours_(settings, days, slots) {
  const warnings = [];

  days.forEach(function(day) {
    if (day.startMinutes === null || day.endMinutes === null) {
      return;
    }

    slots.forEach(function(slot) {
      if (slot.dateKey !== day.dateKey || slot.startMinutes === null) {
        return;
      }

      if (slot.startMinutes < day.startMinutes || slot.endMinutes > day.endMinutes) {
        warnings.push(
          "    " + slot.rowNumber + "行目 " + buildTimeRange_(slot) +
          "（作業時間 " + formatMinutesOfDay_(day.startMinutes) +
          TIME_RANGE_SEPARATOR + formatMinutesOfDay_(day.endMinutes) + "）"
        );
      }
    });
  });

  if (warnings.length === 0) {
    return;
  }

  Logger.log("");
  Logger.log("警告: 作業時間の外にあるコマがあります。");
  Logger.log("  日程シートの作業開始・作業終了か，シフト表の時刻を確かめてください。");
  Logger.log("  このままだと，お疲れさまの通知がシフトより先に届きます。");
  warnings.forEach(function(line) { Logger.log(line); });
}

// 名簿の不備を実行ログへ出す。
function reportMemberIssues_(settings, slots, memberMap) {
  const missing = [];
  const muted = [];

  slots.forEach(function(slot) {
    slot.assigneeNames.forEach(function(name) {
      const key = normalizeName_(name);
      const member = memberMap[key];

      if (!member || !isValidDiscordId_(member.discordId)) {
        if (missing.indexOf(key) < 0) {
          missing.push(key);
        }
        return;
      }

      if (!member.notify && muted.indexOf(key) < 0) {
        muted.push(key);
      }
    });
  });

  Logger.log("[名簿]");

  if (missing.length === 0) {
    Logger.log("  Discord ID 未登録 : なし");
  } else {
    Logger.log("  Discord ID 未登録 : " + missing.join("、"));
    Logger.log("    この人たちはメンションされず，名前だけが出ます。");
  }

  if (muted.length > 0) {
    Logger.log("  通知しない設定    : " + muted.join("、"));
  }
}

