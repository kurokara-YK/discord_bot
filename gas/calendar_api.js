/****************************************************
 * calendar_api.gs
 * ==================================================
 * CalendarApp によるカレンダー取得とイベント取得
 ****************************************************/

// 設定から対象 calendarId を統一して返す。
function getTargetCalendarId_(config) {
  return isBlank_(config.calendarId) ? "primary" : String(config.calendarId).trim();
}

// 対象カレンダーを CalendarApp から取得する。
function getTargetCalendar_(config, callerName) {
  if (config.__resolvedTargetCalendar) {
    return config.__resolvedTargetCalendar;
  }

  const calendarId = getTargetCalendarId_(config);
  const calendar = calendarId === "primary"
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(calendarId);

  if (!calendar) {
    throw new Error(
      (callerName || "getTargetCalendar_") +
      ": カレンダーを取得できませんでした。calendarId=" + calendarId +
      "。IDが誤っているか，実行アカウントに閲覧権限がありません。"
    );
  }

  config.__resolvedTargetCalendar = calendar;
  return calendar;
}

// CalendarEvent を本文生成向けの形へ寄せる。
function normalizeCalendarApiEvent_(event, labelLookup) {
  const title = cleanDescriptionText_(event.getTitle()) || "";
  const description = cleanDescriptionText_(event.getDescription()) || "";
  const colorId = isBlank_(event.getColor()) ? "" : String(event.getColor()).trim();

  return {
    id: String(event.getId() || "").trim(),
    title: title,
    description: description,
    startTime: event.getStartTime(),
    endTime: event.getEndTime(),
    isAllDayEvent: event.isAllDayEvent(),
    eventLabelName: resolveCalendarEventLabelName_({
      colorId: colorId
    }, labelLookup),
    colorId: colorId
  };
}

// 対象日のイベントをすべて取得する。
function getCalendarEventsForDate_(config, targetDate, labelLookup) {
  const dayStart = normalizeToDayStart_(targetDate);

  return getTargetCalendar_(config, "getCalendarEventsForDate_")
    .getEventsForDay(dayStart)
    .map(function(event) {
      return normalizeCalendarApiEvent_(event, labelLookup);
    });
}

// シード同期用に件名一致で予定候補を探す。
function findCalendarEventsByTitle_(config, eventTitle, options) {
  const normalizedTitle = String(eventTitle || "").trim();
  const settings = requireCalendarReminderSettings_(config, "findCalendarEventsByTitle_");
  const searchWindow = buildCalendarLabelSeedSearchWindow_((options || {}).sampleDate);

  if (!normalizedTitle) {
    return [];
  }

  return getTargetCalendar_(settings, "findCalendarEventsByTitle_")
    .getEvents(searchWindow.startTime, searchWindow.endTime)
    .filter(function(event) {
      return String(event.getTitle() || "").trim() === normalizedTitle;
    })
    .map(function(event) {
      return normalizeCalendarApiEvent_(event, null);
    });
}
