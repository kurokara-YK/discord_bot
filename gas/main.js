/****************************************************
 * main.gs
 * ==================================================
 * 当番リマインド Discord BOT のエントリーポイント
 *
 * Apps Script の「実行する関数」に出るのは，このファイルの関数だけ。
 * 末尾が _ の関数は内部用のため一覧に出ない。
 ****************************************************/

// 当番表を読み，今日が通知日の回を Discord へ送る。
// トリガーにはこの関数を設定する。毎日実行してよい。
function duty_roster_main() {
  const settings = getSettings_();
  const now = new Date();

  Logger.log("=== " + settings.label + " ===");

  const targets = selectTargets_(settings, getEntries_(settings), now);

  if (targets.length === 0) {
    Logger.log("今日 (" + toDateKey_(now) + ") 通知する回はありません。");
    return;
  }

  const memberMap = getMemberMap_(settings);
  const webhookUrl = getWebhookUrl_(settings);

  targets.forEach(function(target) {
    send_discord(webhookUrl, buildMessage_(settings, target, memberMap));

    // 送信に成功してからチェックを入れる。
    // 先にチェックすると，送信が失敗したときに通知されないまま送信済みになる。
    markAsSent_(settings, target.rowNumber);

    Logger.log("送信しました。" + target.rowNumber + "行目（No. " + target.no + "）");
  });
}

// 当番表と名簿シートを新規作成する。
// 最初の1回だけ実行する。運用中のシートには実行しないこと。
function create_roster_spreadsheet() {
  const settings = getSettings_();
  const created = createSpreadsheet_(settings);

  Logger.log("当番表を作成しました。");
  Logger.log("  ファイル名 : " + created.name);
  Logger.log("  作成先     : " + created.folderName);
  Logger.log("  URL        : " + created.url);
  Logger.log("");
  Logger.log("このURLを config_roster.js の spreadsheetId に貼り付けてください。");

  return created;
}

// 今日送られる本文を確認する。送信もチェックもしない。
function preview_message() {
  const settings = getSettings_();
  const now = new Date();
  const targets = selectTargets_(settings, getEntries_(settings), now);

  Logger.log("今日の日付: " + toDateKey_(now));

  if (targets.length === 0) {
    Logger.log("今日 通知する回はありません。");
    return;
  }

  const memberMap = getMemberMap_(settings);

  targets.forEach(function(target) {
    Logger.log("--------------------------------");
    Logger.log(target.rowNumber + "行目（No. " + target.no + "）");
    Logger.log("担当日: " + formatDate_(target.dutyDate, settings.fiscalYear));
    Logger.log("");
    Logger.log(buildMessage_(settings, target, memberMap));
  });

  Logger.log("--------------------------------");
  Logger.log("※ まだ送信していません。");
}

// 設定とシートの状態を確認する。動かないときは，まずこれを実行する。
// 名簿の登録漏れもここで分かる。
function check_settings() {
  const settings = getSettings_();

  Logger.log("表示名        : " + settings.label);
  Logger.log("Webhook URL   : " + (settings.webhookUrl.indexOf("https://") === 0
    ? "設定されています" : "未設定です"));
  Logger.log("当番表シート  : " + settings.rosterSheetName);
  Logger.log("名簿シート    : " + settings.memberSheetName);
  Logger.log("年度          : " + settings.fiscalYear.startYear + "年度（開始月 " +
    settings.fiscalYear.startMonth + "月）");

  const entries = getEntries_(settings);
  const memberMap = getMemberMap_(settings);
  const sentCount = entries.filter(function(e) { return e.isSent; }).length;

  Logger.log("当番表のデータ: " + entries.length + " 行（通知済み " + sentCount + " 件）");
  Logger.log("名簿の登録人数: " + Object.keys(memberMap).length + " 人");

  const unknown = collectUnknownMembers_(entries, memberMap);

  if (unknown.length === 0) {
    Logger.log("名簿の確認    : 担当者は全員 Discord ID が登録されています。");
    return;
  }

  Logger.log("名簿の確認    : 次の担当者は Discord ID が未登録です。名前だけで通知されます。");
  unknown.forEach(function(name) { Logger.log("  ・" + name); });
}

// Discord へ届くかどうかだけ確かめる。
function test_send_discord() {
  const settings = getSettings_();

  send_discord(getWebhookUrl_(settings), "【テスト送信】" + settings.label + " からの送信確認です。");

  Logger.log("テスト送信しました。Discord のチャンネルを確認してください。");
}
