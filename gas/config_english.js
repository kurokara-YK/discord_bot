/****************************************************
 * config_english.gs
 * ==================================================
 * 英語学習 Discord BOT の設定ファイル
 *
 * 「ここに入れてください」と書かれた項目に，
 * 自分の値を書き込んでから使うこと。
 *
 * 【注意】
 *   このファイルには Webhook URL などの自分だけの値が入る。
 *   他人に見せたり，どこかへ貼り付けたりしないこと。
 *
 *   このファイルは .gitignore に含まれていないため，
 *   git add -A などで意図せずコミットされる可能性がある。
 *   GitHub などへ公開する前に，値が残っていないか必ず確認すること。
 *
 *   誤って Webhook URL を公開してしまった場合は，
 *   Discord 側でそのウェブフックを削除し，作り直すこと。
 ****************************************************/

const ENGLISH_LEARNING_SETTINGS = {
  // 実行ログに出す表示名。好きな名前でよい。
  label: "英語学習 Discord BOT",

  // Discord Webhook URL。
  // Discord のチャンネル設定 → 連携サービス → ウェブフック から
  // 「ウェブフックURLをコピー」で取得した URL を貼り付ける。
  // このURLを知っている人は誰でも投稿できるため，他人に見せないこと。
  webhookUrl: "ここにDiscordのWebhook URLを入れてください",

  // english_learning_main が読み取りに使うスプレッドシート。
  // 学習データのスプレッドシートを開いたときの，アドレスバーのURLをそのまま貼り付ける。
  // create_english_learning_spreadsheet_template_with_sample を実行すると
  // 実行ログにURLが出るので，その値を貼り付けてもよい。
  spreadsheetId: "ここに学習データのスプレッドシートのURLを入れてください",

  // テンプレート作成先の Google ドライブのフォルダ。
  // Google ドライブでフォルダを開いたときの，アドレスバーのURLをそのまま貼り付ける。
  templateFolderId: "ここに作成先のGoogleドライブのフォルダのURLを入れてください",

  // テンプレート作成時のスプレッドシート名。
  // create_english_learning_spreadsheet_template
  // create_english_learning_spreadsheet_template_with_sample
  // で作られるファイルの名前になる。
  templateFileName: "English Learning Sheet",

  // 送信に使う学習データシート名。
  // スプレッドシート下部のタブに表示されている名前と一致させること。
  sentenceSheetName: "sentences",

  // 1回の実行で送る文数。1文につき Discord へ 1 メッセージ送信する。
  // 例: 10 にすると 1 回の実行で 10 メッセージ送信される。
  batchSize: 1,

  // 送信対象の開始番号。
  startNumber: 1,

  // sequential: No. の小さい順に送る / random: ランダムに送る
  // sequential では最後の文まで送ると停止し，先頭には戻らない。
  // 先頭から送り直すには reset_english_learning_progress を実行する。
  sendMode: "sequential",

  // 送信を許可する時間帯。startHour 以上 endHour 未満で判定する。
  // 行頭に // を付けるとその時間帯には送信されない。
  // 生活リズムに合わせて自由に書き換えてよい。
  // 例: 時間帯を制限しない場合は [{ startHour: 0, endHour: 24 }] だけにする。
  allowedTimeRanges: [
    // { startHour: 0, endHour: 1 },
    // { startHour: 1, endHour: 2 },
    // { startHour: 2, endHour: 3 },
    // { startHour: 3, endHour: 4 },
    // { startHour: 4, endHour: 5 },
    // { startHour: 5, endHour: 6 },
    // { startHour: 6, endHour: 7 },
    // { startHour: 7, endHour: 8 },
    // { startHour: 8, endHour: 9 },
    { startHour: 9, endHour: 10 },
    { startHour: 10, endHour: 11 },
    { startHour: 11, endHour: 12 },
    { startHour: 12, endHour: 13 },
    { startHour: 13, endHour: 14 },
    { startHour: 14, endHour: 15 },
    { startHour: 15, endHour: 16 },
    { startHour: 16, endHour: 17 },
    { startHour: 17, endHour: 18 },
    { startHour: 18, endHour: 19 },
    { startHour: 19, endHour: 20 },
    { startHour: 20, endHour: 21 },
    { startHour: 21, endHour: 22 },
    { startHour: 22, endHour: 23 },
    { startHour: 23, endHour: 24 }
  ],

  // メッセージを連続送信するときの送信間隔（ミリ秒）。
  // Discord のレート制限を避けるための待ち時間。
  sendIntervalMs: 1000,

  // 英語チャンクを 1 つずつ Google翻訳リンクにするか。
  // true にすると，チャンクをタップした時点で翻訳画面に本文が入力済みになる。
  chunkLinkEnabled: true,

  // 全文ぶんの Google翻訳リンクを本文末尾に付けるか。
  sentenceLinkEnabled: true,

  // 全文リンクの表示名。
  sentenceLinkLabel: "🔊 全文を聞く",

  // Google翻訳の翻訳元／翻訳先の言語コード。
  translateSourceLang: "en",
  translateTargetLang: "ja",

  // Discord 本文の先頭ラベル。
  messageTitlePrefix: "英語復習",

  // Discord の1メッセージあたりの安全な最大文字数。
  discordMessageMaxLength: 1800
};
