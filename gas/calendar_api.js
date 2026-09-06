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

// CalendarApp のイベントIDを Calendar API 用のIDへ寄せる。
// CalendarApp は "xxxxx@google.com" を返すが，API は "@" より前だけを使う。
function toCalendarApiEventId_(eventId) {
  const rawId = String(eventId || "").trim();

  if (!rawId) {
    return "";
  }

  return rawId.split("@")[0];
}

// 対象カレンダーの色情報を Calendar API からまとめて取得する。
// CalendarApp では eventLabelId（名前付きラベル）を取得できないため，
// Advanced Calendar Service から補う。
function fetchCalendarColorInfoMap_(config, startTime, endTime) {
  const calendarId = getTargetCalendarId_(config);
  const colorInfoByEventId = {};

  try {
    let pageToken = "";

    do {
      const response = Calendar.Events.list(calendarId, {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        maxResults: 250,
        pageToken: pageToken || undefined
      });

      ((response || {}).items || []).forEach(function(item) {
        const itemId = String((item || {}).id || "").trim();

        if (!itemId) {
          return;
        }

        colorInfoByEventId[itemId] = {
          colorId: isBlank_(item.colorId) ? "" : String(item.colorId).trim(),
          eventLabelId: isBlank_(item.eventLabelId) ? "" : String(item.eventLabelId).trim()
        };
      });

      pageToken = String((response || {}).nextPageToken || "");
    } while (pageToken);
  } catch (error) {
    // 取得できなくても CalendarApp 側の色で動かせるため，止めずに続ける。
    Logger.log(
      "fetchCalendarColorInfoMap_: Calendar API から色を取得できませんでした。" +
      "CalendarApp の色だけで続行します。reason=" + error.message
    );
  }

  return colorInfoByEventId;
}

// CalendarEvent を本文生成向けの形へ寄せる。
// colorInfoByEventId を渡すと，CalendarApp が返せない
// eventLabelId（名前付きラベル）をそこから補う。
function normalizeCalendarApiEvent_(event, labelLookup, colorInfoByEventId) {
  const title = cleanDescriptionText_(event.getTitle()) || "";
  const description = cleanDescriptionText_(event.getDescription()) || "";
  const colorInfo = (colorInfoByEventId || {})[toCalendarApiEventId_(event.getId())] || {};
  const nativeColorId = isBlank_(event.getColor()) ? "" : String(event.getColor()).trim();
  const colorId = nativeColorId || (isBlank_(colorInfo.colorId) ? "" : String(colorInfo.colorId).trim());
  const eventLabelId = isBlank_(colorInfo.eventLabelId) ? "" : String(colorInfo.eventLabelId).trim();

  return {
    id: String(event.getId() || "").trim(),
    title: title,
    description: description,
    startTime: event.getStartTime(),
    endTime: event.getEndTime(),
    isAllDayEvent: event.isAllDayEvent(),
    eventLabelName: resolveCalendarEventLabelName_({
      colorId: colorId,
      eventLabelId: eventLabelId
    }, labelLookup),
    colorId: colorId,
    eventLabelId: eventLabelId
  };
}

// 対象日のイベントをすべて取得する。
function getCalendarEventsForDate_(config, targetDate, labelLookup) {
  const dayStart = normalizeToDayStart_(targetDate);
  const dayEnd = new Date(dayStart);

  dayEnd.setHours(23, 59, 59, 999);

  const colorInfoByEventId = fetchCalendarColorInfoMap_(config, dayStart, dayEnd);

  return getTargetCalendar_(config, "getCalendarEventsForDate_")
    .getEventsForDay(dayStart)
    .map(function(event) {
      return normalizeCalendarApiEvent_(event, labelLookup, colorInfoByEventId);
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

  const colorInfoByEventId = fetchCalendarColorInfoMap_(
    settings,
    searchWindow.startTime,
    searchWindow.endTime
  );

  return getTargetCalendar_(settings, "findCalendarEventsByTitle_")
    .getEvents(searchWindow.startTime, searchWindow.endTime)
    .filter(function(event) {
      return String(event.getTitle() || "").trim() === normalizedTitle;
    })
    .map(function(event) {
      return normalizeCalendarApiEvent_(event, null, colorInfoByEventId);
    });
}
