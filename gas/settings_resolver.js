/****************************************************
 * settings_resolver.gs
 * ==================================================
 * Googleカレンダー通知BOT 用の設定解決
 ****************************************************/

// ユーザー設定を読み込み，実行用の設定オブジェクトへ整える。
function getCalendarReminderSettings_() {
  return requireCalendarReminderSettings_(CALENDAR_REMINDER_SETTINGS, "getCalendarReminderSettings_");
}

// Webhook URL を検証して返す。
function getCalendarWebhookUrl_(settings, callerName) {
  const webhookUrl = settings.webhookUrl;

  if (!webhookUrl || String(webhookUrl).indexOf("Webhook URL") !== -1) {
    throw new Error(callerName + ": Discord Webhook URL が未設定です。");
  }

  return String(webhookUrl).trim();
}

// 実行前に設定値を読みやすい形へそろえる。
function requireCalendarReminderSettings_(settings, callerName) {
  if (!settings) {
    throw new Error(callerName + ": settings が未指定です。");
  }

  const normalized = Object.assign({}, settings);

  normalized.label = normalized.label || "Googleカレンダー連携 Discord リマインダーBOT";
  normalized.calendarId = isBlank_(normalized.calendarId) ? "primary" : String(normalized.calendarId).trim();
  normalized.webhookUrl = isBlank_(normalized.webhookUrl) ? "" : String(normalized.webhookUrl).trim();
  normalized.targetEventLabels = normalizeLabelFilterList_(normalized.targetEventLabels);
  normalized.enableTomorrowReminder = normalized.enableTomorrowReminder !== false;
  normalized.enableTodayReminder = normalized.enableTodayReminder !== false;
  normalized.notifyIfEmpty = normalized.notifyIfEmpty === true;
  normalized.showDescription = normalized.showDescription !== false;
  normalized.descriptionMaxLength = Math.max(0, toIntegerOrDefault_(normalized.descriptionMaxLength, 80));
  normalized.calendarLinkView = normalizeCalendarLinkView_(normalized.calendarLinkView);
  normalized.calendarUrlBase = isBlank_(normalized.calendarUrlBase)
    ? "https://calendar.google.com/calendar/u/0/r"
    : String(normalized.calendarUrlBase).trim();

  return normalized;
}
