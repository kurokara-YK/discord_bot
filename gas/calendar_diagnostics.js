/****************************************************
 * calendar_diagnostics.gs
 * ==================================================
 * ラベル取得やイベント取得の診断ログ
 ****************************************************/

// レジストリ内容を Logger に出す。
function logCalendarLabelRegistry_(config) {
  const targetCalendarKey = getTargetCalendarProfileKey_(config);
  const targetCalendarId = getTargetCalendarId_(config);
  const profile = getCalendarLabelProfile_(targetCalendarKey);
  const seeds = getCalendarLabelRegistrySeeds_(targetCalendarKey);
  const registry = getStoredCalendarLabelRegistry_(targetCalendarId);
  const lookup = buildCalendarLabelRegistryLookup_(registry);

  Logger.log("=== 保存済みラベルレジストリ ===");
  Logger.log("calendarName=" + targetCalendarKey);
  Logger.log("calendarId=" + targetCalendarId);
  Logger.log("profileSource=" + profile.source);
  Logger.log("seedCount=" + seeds.length);

  if (seeds.length === 0) {
    Logger.log("シード設定はありません。config_labels.js の CALENDAR_LABEL_PROFILES を確認してください。");
  } else {
    seeds.forEach(function(seed) {
      Logger.log(JSON.stringify(seed));
    });
  }

  if (Object.keys(lookup.entriesByNameKey).length === 0) {
    Logger.log("保存済みレジストリは空です。");
  } else {
    Object.keys(lookup.entriesByNameKey).forEach(function(nameKey) {
      const entry = lookup.entriesByNameKey[nameKey];
      Logger.log(JSON.stringify(entry));

      if (isBlank_(entry.colorId) && isBlank_(entry.eventLabelId)) {
        Logger.log("未同期ラベルです。labelName=" + entry.labelName + "。sampleEventTitle を確認して sync_calendar_label_registry を再実行してください。");
      }
    });
  }

  if (lookup.collisions.length > 0) {
    Logger.log("colorId の衝突があります: " + lookup.collisions.join(" | "));
  }
}

// レジストリと各予定の colorId をまとめて診断ログへ出す。
function logCalendarLabelDiagnostics_(config, targetDate) {
  const settings = requireCalendarReminderSettings_(config, "logCalendarLabelDiagnostics_");
  const labelLookup = buildCalendarLabelRegistryLookup_(getStoredCalendarLabelRegistry_(getTargetCalendarId_(settings)));
  const resolvedTargetDate = normalizeToDayStart_(targetDate || getTargetDateByOffsetDays_(0));
  const events = getCalendarEventsForDate_(settings, resolvedTargetDate, labelLookup);

  Logger.log("=== ラベル診断 ===");
  Logger.log("calendarId=" + getTargetCalendarId_(settings));

  logCalendarLabelRegistry_(settings);

  if (events.length === 0) {
    Logger.log("診断対象日の予定はありません。date=" + formatDateKey_(resolvedTargetDate));
    return;
  }

  events.forEach(function(event) {
    Logger.log(JSON.stringify({
      title: event.title,
      start: event.isAllDayEvent ? "終日" : formatTime_(event.startTime),
      end: event.isAllDayEvent ? "終日" : formatTime_(event.endTime),
      eventLabelName: event.eventLabelName,
      colorId: event.colorId,
      eventLabelId: event.eventLabelId,
      isAllDayEvent: event.isAllDayEvent
    }));
  });
}

// シード探索期間の全予定を，件名と生の色つきで一覧する。
// 「件名が見つからない」のか「色が空」なのかを切り分けるために使う。
function logCalendarSeedCandidates_(config) {
  const settings = requireCalendarReminderSettings_(config, "logCalendarSeedCandidates_");
  const calendar = getTargetCalendar_(settings, "logCalendarSeedCandidates_");
  const targetCalendarKey = getTargetCalendarProfileKey_(settings);
  const targetCalendarId = getTargetCalendarId_(settings);
  const profile = getCalendarLabelProfile_(targetCalendarKey);
  const seeds = getCalendarLabelRegistrySeeds_(targetCalendarKey);
  const timeZone = Session.getScriptTimeZone();

  Logger.log("=== シード件名の突き合わせ ===");
  Logger.log("calendarName=" + targetCalendarKey);
  Logger.log("calendarId=" + targetCalendarId);
  Logger.log("profileSource=" + profile.source);

  seeds.forEach(function(seed) {
    const window = buildCalendarLabelSeedSearchWindow_(seed.sampleDate);
    const matched = calendar.getEvents(window.startTime, window.endTime).filter(function(event) {
      return String(event.getTitle() || "").trim() === seed.sampleEventTitle;
    });

    if (matched.length === 0) {
      Logger.log("[" + seed.labelName + "] 件名一致なし。sampleEventTitle=" + seed.sampleEventTitle);
      return;
    }

    const colorInfoByEventId = fetchCalendarColorInfoMap_(settings, window.startTime, window.endTime);

    matched.forEach(function(event) {
      const info = colorInfoByEventId[toCalendarApiEventId_(event.getId())] || {};

      Logger.log(
        "[" + seed.labelName + "] 一致あり。" +
        "date=" + Utilities.formatDate(event.getStartTime(), timeZone, "yyyy/MM/dd") +
        ", colorId=" + (isBlank_(info.colorId) ? "(空)" : info.colorId) +
        ", eventLabelId=" + (isBlank_(info.eventLabelId) ? "(空)" : info.eventLabelId)
      );
    });
  });

  Logger.log("=== 探索期間内の全予定 ===");

  const overall = buildCalendarLabelSeedSearchWindow_(seeds.length > 0 ? seeds[0].sampleDate : "");

  const overallColorInfoByEventId = fetchCalendarColorInfoMap_(settings, overall.startTime, overall.endTime);

  calendar.getEvents(overall.startTime, overall.endTime).forEach(function(event) {
    const info = overallColorInfoByEventId[toCalendarApiEventId_(event.getId())] || {};

    Logger.log(
      "title=[" + event.getTitle() + "]" +
      ", date=" + Utilities.formatDate(event.getStartTime(), timeZone, "yyyy/MM/dd") +
      ", colorId=" + (isBlank_(info.colorId) ? "(空)" : info.colorId) +
      ", eventLabelId=" + (isBlank_(info.eventLabelId) ? "(空)" : info.eventLabelId)
    );
  });
}
