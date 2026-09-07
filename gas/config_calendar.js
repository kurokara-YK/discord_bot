/****************************************************
 * config_calendar.gs
 * ==================================================
 * Googleカレンダー通知BOT 用の設定
 ****************************************************/

// 使うカレンダーの一覧。左が呼び名，右が実際のカレンダーID。
// 長いIDを書くのはここだけ。増やしたいときは行を足す。
//   "primary"                        … メインカレンダー
//   "example@gmail.com"              … 自分のメールアドレス（primary と同じ）
//   "xxxx@group.calendar.google.com" … サブカレンダー・共有カレンダー
//
// ここで付けた呼び名を config_labels.js の CALENDAR_LABEL_PROFILES でも使う。
const CALENDAR_BOOK = {
  "メインカレンダー": "primary",
  "サブカレンダー1": "サブカレンダーのIDをここに入れる"
};

const CALENDAR_REMINDER_SETTINGS = {
  label: "Googleカレンダー連携 Discord リマインダーBOT",

  // Discord Webhook URL を直接書く。
  webhookUrl: "DiscordのWebhook URLをここに入れる",

  // 対象カレンダー。1つだけ指定できる。
  // 上の CALENDAR_BOOK に登録した呼び名を書く。
  // カレンダーを切り替えるときは，ここを書き換えるだけでよい。
  // （カレンダーIDを直接書いてもそのまま動く）
  // → 詳しくは README「設定項目一覧」
  calendarId: "メインカレンダー",

  // 通知対象ラベル名。false なら全予定を通知する。
  // ラベルで絞り込みたい場合は false を true に変える。
  // true にすると，config_labels.js の CALENDAR_LABEL_PROFILES から
  // このカレンダー用に書いたラベル一覧が自動で使われる。
  // 特定のラベルだけに絞りたいときは ["超重要", "重要"] のように直接書いてもよい。
  targetEventLabels: false,

  // 明日の予定通知を有効にするかどうか。
  enableTomorrowReminder: true,

  // 今日の予定通知を有効にするかどうか。
  enableTodayReminder: true,

  // 対象予定が0件の日でも「予定はありません」と通知するかどうか。
  notifyIfEmpty: false,

  // 予定の説明欄をDiscord本文に含めるかどうか。
  showDescription: true,

  // 説明欄を載せるときの最大文字数。
  descriptionMaxLength: 80,

  // Discord本文末尾のリンクを開いたときの表示形式。
  //   "day" … 日   "week" … 週   "month" … 月   "year" … 年
  calendarLinkView: "week",

  // Discord本文末尾に出す Google カレンダーの日付リンクのベースURL。
  calendarUrlBase: "https://calendar.google.com/calendar/u/0/r"
};
