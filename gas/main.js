/****************************************************
 * main.gs
 * ==================================================
 * Googleカレンダー通知BOT 全体のエントリーポイント
 ****************************************************/

// 本番運用用の入口として本日通知と前日通知をまとめて1回送る。
function calendar_reminder_main() {
  calendar_reminder_main_for_settings(getCalendarReminderSettings_());
}

// 設定に応じて本日通知と前日通知を1つのメッセージにまとめる。
function calendar_reminder_main_for_settings(settings, options) {
  settings = requireCalendarReminderSettings_(settings, "calendar_reminder_main_for_settings");
  options = options || {};

  Logger.log("=== calendar_reminder_main_for_settings 開始: " + settings.label + " ===");
  syncCalendarLabelRegistry_(settings);
  sendCalendarReminderPayload_(buildDailyDigestPayload_(settings, options));
  Logger.log("=== calendar_reminder_main_for_settings 完了 ===");
}

// 当日通知だけを個別に送る。
function calendar_today_reminder_main(settings, options) {
  settings = requireCalendarReminderSettings_(settings || getCalendarReminderSettings_(), "calendar_today_reminder_main");
  syncCalendarLabelRegistry_(settings);
  sendCalendarReminderPayload_(buildTodayReminderPayload_(settings, options));
}

// 前日通知だけを個別に送る。
function calendar_tomorrow_reminder_main(settings, options) {
  settings = requireCalendarReminderSettings_(settings || getCalendarReminderSettings_(), "calendar_tomorrow_reminder_main");
  syncCalendarLabelRegistry_(settings);
  sendCalendarReminderPayload_(buildTomorrowReminderPayload_(settings, options));
}

// payload があるときだけ Discord へ送信する。
function sendCalendarReminderPayload_(payload) {
  if (!payload) {
    Logger.log("sendCalendarReminderPayload_: 送信対象はありません。");
    return;
  }

  send_discord(payload.webhookUrl, payload.content);
  Logger.log(payload.label + "を送信しました。date=" + formatDateKey_(payload.targetDate) + ", events=" + payload.eventCount);
}

// Discord Webhook の接続確認用に固定文面を送る。
function test_send_discord_message() {
  const settings = getCalendarReminderSettings_();
  send_discord(getCalendarWebhookUrl_(settings, "test_send_discord_message"), "【テスト送信】Googleカレンダー通知BOT からの送信確認です。");
}

// Script Properties 上のラベルレジストリを手動同期する。
// 手動実行時は色を覚え直したい場面なので，覚え済みのシードも取り直す。
function sync_calendar_label_registry() {
  const settings = getCalendarReminderSettings_();
  syncCalendarLabelRegistry_(settings, { force: true });
  logCalendarLabelRegistry_(settings);
}

// 保存済みラベルレジストリを空に戻す。
function clear_calendar_label_registry() {
  clearStoredCalendarLabelRegistry_();
  Logger.log("保存済みラベルレジストリを削除しました。");
}

// レジストリと各予定の colorId をまとめて診断する。
function inspect_calendar_labels() {
  const settings = getCalendarReminderSettings_();
  syncCalendarLabelRegistry_(settings, { force: true });
  logCalendarLabelDiagnostics_(settings, getTargetDateByOffsetDays_(0));
}
