/****************************************************
 * main.gs
 * ==================================================
 * 英語学習 Discord BOT のエントリーポイント
 *
 * Apps Script の「実行する関数」から選べるのはこのファイルの関数だけ。
 * 末尾が _ の関数は内部用のため一覧に出ない。
 ****************************************************/

// 本番運用用の入口。トリガーにはこの関数を設定する。
// 設定に応じてスプレッドシートから英文を取得し Discord へ送る。
function english_learning_main() {
  const settings = getEnglishLearningSettings_();

  Logger.log("=== english_learning_main 開始: " + settings.label + " ===");

  const now = new Date();

  if (!isAllowedEnglishLearningTime_(settings, now)) {
    Logger.log("現在時刻は送信対象外です。hour=" + now.getHours());
    Logger.log("送信する時間帯は config_english.js の allowedTimeRanges で変更できます。");
    return;
  }

  const entries = pickEnglishLearningEntries_(settings);

  if (entries.length === 0) {
    Logger.log("送信対象の英文がありません。");
    return;
  }

  const messages = buildEnglishLearningMessages_(settings, entries);

  sendDiscordMessages_(
    getEnglishLearningWebhookUrl_(settings, "english_learning_main"),
    messages,
    settings.sendIntervalMs
  );

  Logger.log("送信完了: entries=" + entries.length + ", messages=" + messages.length);
  Logger.log("=== english_learning_main 完了 ===");
}

// 学習データ用スプレッドシートを，見出しだけの空の状態で新規作成する。
function create_english_learning_spreadsheet_template() {
  return createAndLogEnglishLearningTemplate_([]);
}

// 学習データ用スプレッドシートを，記入例10文つきで新規作成する。
// はじめて使うときは，こちらで書き方を確認するとわかりやすい。
function create_english_learning_spreadsheet_template_with_sample() {
  return createAndLogEnglishLearningTemplate_(ENGLISH_LEARNING_SAMPLE_ROWS);
}

// Discord Webhook の接続確認用に固定文面を送る。
function test_send_discord_message() {
  const settings = getEnglishLearningSettings_();

  send_discord(
    getEnglishLearningWebhookUrl_(settings, "test_send_discord_message"),
    "【テスト送信】" + settings.label + " からの送信確認です。"
  );

  Logger.log("テスト送信を実行しました。Discord のチャンネルを確認してください。");
}

// 順番送信の進捗を初期化する。次回送信が startNumber から始まるようになる。
function reset_english_learning_progress() {
  clearEnglishLearningProgress_();
  Logger.log("順番送信の進捗を初期化しました。次回は No." + getEnglishLearningSettings_().startNumber + " から送信します。");
}

// テンプレートを作成し，作成先を実行ログへ出す。
function createAndLogEnglishLearningTemplate_(dataRows) {
  const settings = getEnglishLearningSettings_();
  const created = createEnglishLearningSpreadsheetTemplate_(settings, dataRows);

  Logger.log("テンプレートを作成しました。");
  Logger.log("  ファイル名   : " + created.name);
  Logger.log("  シート名     : " + created.sheetName);
  Logger.log("  記入例の行数 : " + created.dataRowCount);
  Logger.log("  spreadsheetId: " + created.spreadsheetId);
  Logger.log("  URL          : " + created.url);
  Logger.log("この spreadsheetId または URL を config_english.js の spreadsheetId に設定してください。");

  return created;
}
