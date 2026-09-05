/****************************************************
 * calendar_diagnostics.gs
 * ==================================================
 * ラベル取得やイベント取得の診断ログ
 ****************************************************/

// レジストリ内容を Logger に出す。
function logCalendarLabelRegistry_(config) {
  const seeds = getCalendarLabelRegistrySeeds_();
  const registry = getStoredCalendarLabelRegistry_();
  const lookup = buildCalendarLabelRegistryLookup_(registry);

  Logger.log("=== 保存済みラベルレジストリ ===");
  Logger.log("calendarId=" + getTargetCalendarId_(config));
  Logger.log("seedCount=" + seeds.length);

  if (seeds.length === 0) {
    Logger.log("シード設定はありません。config_labels.js の CALENDAR_LABEL_REGISTRY_SEEDS を確認してください。");
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

      if (isBlank_(entry.colorId)) {
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
  const labelLookup = buildCalendarLabelRegistryLookup_(getStoredCalendarLabelRegistry_());
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
      isAllDayEvent: event.isAllDayEvent
    }));
  });
}
