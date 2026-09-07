/****************************************************
 * calendar_labels.gs
 * ==================================================
 * ラベル条件によるイベント判定
 ****************************************************/

// 保存済みレジストリから lookup を組み立てる。
function buildCalendarLabelLookup_(config) {
  const registry = getStoredCalendarLabelRegistry_(getTargetCalendarId_(config));
  const lookup = buildCalendarLabelRegistryLookup_(registry);
  const targetLabelNameKeys = normalizeStringList_(config.targetEventLabels).map(function(labelName) {
    return normalizeCalendarLabelNameKey_(labelName);
  });
  const unresolvedTargetLabels = normalizeStringList_(config.targetEventLabels).filter(function(labelName) {
    const entry = lookup.entriesByNameKey[normalizeCalendarLabelNameKey_(labelName)];

    if (entry && isDefaultCalendarLabelName_(entry.labelName)) {
      return false;
    }

    return !entry || (isBlank_(entry.colorId) && isBlank_(entry.eventLabelId));
  });

  if (unresolvedTargetLabels.length > 0) {
    throw new Error(
      "buildCalendarLabelLookup_: 次のラベルが内部レジストリへ未登録です。missing=" +
      unresolvedTargetLabels.join(", ") +
      "。sync_calendar_label_registry を実行し，config_labels.js の CALENDAR_LABEL_PROFILES を確認してください。"
    );
  }

  lookup.targetLabelNameKeys = targetLabelNameKeys;
  return lookup;
}

// ラベルフィルタに一致する予定かどうかを判定する。
function isTargetLabeledEvent_(config, event, labelLookup) {
  if (!config.targetEventLabels || config.targetEventLabels.length === 0) {
    return true;
  }

  return labelLookup.targetLabelNameKeys.indexOf(normalizeCalendarLabelNameKey_(event.eventLabelName)) !== -1;
}

// 指定日のイベントをラベル条件つきで返す。
function getFilteredCalendarEventsForDate_(config, targetDate) {
  const labelLookup = buildCalendarLabelLookup_(config);
  const events = getCalendarEventsForDate_(config, targetDate, labelLookup).filter(function(event) {
    return isTargetLabeledEvent_(config, event, labelLookup) && shouldNotifyCalendarEvent_(event);
  });

  return sortCalendarEvents_(events);
}
