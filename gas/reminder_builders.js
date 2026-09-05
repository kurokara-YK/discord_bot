/****************************************************
 * reminder_builders.gs
 * ==================================================
 * 通知本文と送信 payload の組み立て
 ****************************************************/

// 通知の種類ごとの定義。dayOffset は今日を 0 とした日数。
const CALENDAR_REMINDER_KINDS = {
  today: { dayOffset: 0, label: "本日通知", title: "📅 本日の予定" },
  tomorrow: { dayOffset: 1, label: "前日通知", title: "📅 明日の予定" }
};

// 通知の種類と対象日から，セクション作成用のオプションを組み立てる。
function buildCalendarReminderKindOptions_(kindName, targetDate) {
  const kind = CALENDAR_REMINDER_KINDS[kindName];

  return {
    dayOffset: kind.dayOffset,
    targetDate: targetDate,
    label: kind.label,
    title: kind.title
  };
}

// 対象日のイベントを集めて通知セクション用のデータにまとめる。
function buildCalendarReminderSection_(settings, options) {
  settings = requireCalendarReminderSettings_(settings, "buildCalendarReminderSection_");
  options = options || {};

  const label = options.label || "カレンダー通知";
  const targetDate = options.targetDate
    ? normalizeToDayStart_(options.targetDate)
    : getTargetDateByOffsetDays_(toIntegerOrDefault_(options.dayOffset, 0));
  const events = getFilteredCalendarEventsForDate_(settings, targetDate);

  if (events.length === 0 && !settings.notifyIfEmpty) {
    Logger.log(label + ": 対象予定がないためセクションを作成しません。date=" + formatDateKey_(targetDate));
    return null;
  }

  return {
    label: label,
    targetDate: targetDate,
    eventCount: events.length,
    title: options.title || "📅 予定リマインド",
    events: events
  };
}

// セクション一覧から Discord 送信用の payload を組み立てる。
function buildCalendarReminderPayloadFromSections_(settings, sections, callerName) {
  if (sections.length === 0) {
    Logger.log(callerName + ": 送信対象セクションはありません。");
    return null;
  }

  return {
    label: sections.map(function(section) {
      return section.label;
    }).join(" / "),
    targetDate: sections[0].targetDate,
    eventCount: sections.reduce(function(total, section) {
      return total + section.eventCount;
    }, 0),
    webhookUrl: getCalendarWebhookUrl_(settings, callerName),
    content: buildCombinedCalendarReminderMessage_(settings, sections)
  };
}

// 通知の種類を1つだけ対象に payload を組み立てる。
function buildSingleKindReminderPayload_(settings, kindName, options) {
  settings = requireCalendarReminderSettings_(settings, "buildSingleKindReminderPayload_");
  options = options || {};

  const section = buildCalendarReminderSection_(
    settings,
    buildCalendarReminderKindOptions_(kindName, options.targetDate)
  );

  return buildCalendarReminderPayloadFromSections_(
    settings,
    section ? [section] : [],
    "buildSingleKindReminderPayload_"
  );
}

// 今日の予定だけを対象に通知本文を組み立てる。
function buildTodayReminderPayload_(settings, options) {
  return buildSingleKindReminderPayload_(settings, "today", options);
}

// 明日の予定だけを対象に通知本文を組み立てる。
function buildTomorrowReminderPayload_(settings, options) {
  return buildSingleKindReminderPayload_(settings, "tomorrow", options);
}

// 本日通知と前日通知を1回分のメッセージへまとめる。
function buildDailyDigestPayload_(settings, options) {
  settings = requireCalendarReminderSettings_(settings, "buildDailyDigestPayload_");
  options = options || {};

  const enabledByKind = {
    today: { enabled: settings.enableTodayReminder, targetDate: options.todayTargetDate },
    tomorrow: { enabled: settings.enableTomorrowReminder, targetDate: options.tomorrowTargetDate }
  };
  const sections = [];

  ["today", "tomorrow"].forEach(function(kindName) {
    const kind = enabledByKind[kindName];

    if (!kind.enabled) {
      Logger.log(CALENDAR_REMINDER_KINDS[kindName].label + "は無効です。");
      return;
    }

    const section = buildCalendarReminderSection_(
      settings,
      buildCalendarReminderKindOptions_(kindName, kind.targetDate)
    );

    if (section) {
      sections.push(section);
    }
  });

  return buildCalendarReminderPayloadFromSections_(settings, sections, "buildDailyDigestPayload_");
}
