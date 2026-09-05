/****************************************************
 * calendar_formatters.gs
 * ==================================================
 * 日時・説明文・Discord通知本文の整形
 ****************************************************/

// 日本語の日付表記へ整える。
function formatJapaneseDate_(date) {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const normalized = normalizeToDayStart_(date);

  return normalized.getFullYear() + "年" +
    (normalized.getMonth() + 1) + "月" +
    normalized.getDate() + "日（" + weekdays[normalized.getDay()] + "）";
}

// 時刻表示を HH:mm に統一する。
function formatTime_(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), "HH:mm");
}

// 予定の時間帯文字列を本文向けに整える。
function buildEventTimeText_(event) {
  if (event.isAllDayEvent) {
    return "終日";
  }

  return formatTime_(event.startTime) + "〜" + formatTime_(event.endTime);
}

// ラベル名があるときは本文表示用の文字列にする。
function buildEventLabelText_(event) {
  return event.eventLabelName ? "[" + event.eventLabelName + "]" : "";
}

// 説明文の改行や余分な空白をたたむ。
function cleanDescriptionText_(text) {
  if (isBlank_(text)) {
    return "";
  }

  return String(text)
    .replace(/https?:\/\/www\.notion\.so\/\S+/gi, " ")
    .replace(/https?:\/\/notion\.so\/\S+/gi, " ")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Discord に載せる説明文を適切な長さで切り詰める。
function truncateDescriptionText_(text, maxLength) {
  const normalized = cleanDescriptionText_(text);

  if (!normalized || maxLength <= 0) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength) + "...続きはカレンダー";
}

// 対象日の Google カレンダー URL を組み立てる。
// config.calendarLinkView が day / week / month / year の表示形式を決める。
function buildCalendarDayUrl_(config, targetDate) {
  const base = String(config.calendarUrlBase).replace(/\/+$/, "");
  const view = normalizeCalendarLinkView_(config.calendarLinkView);
  const date = normalizeToDayStart_(targetDate);

  return base + "/" + view + "/" + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
}

// 本文末尾のカレンダーリンクを Markdown で作る。
function buildCalendarDayLinkMarkdown_(config, targetDate) {
  return "[🔗 Googleカレンダーで確認](<" + buildCalendarDayUrl_(config, targetDate) + ">)";
}

// 予定1件分の行を階層構造で組み立てる。
function buildCalendarEventLines_(config, event) {
  const labelText = buildEventLabelText_(event);
  const eventTitle = event.title || "（無題の予定）";
  const lines = ["**" + buildEventTimeText_(event) + "**"];

  lines.push("> " + (labelText ? labelText + " " : "") + eventTitle);

  if (config.showDescription) {
    const description = truncateDescriptionText_(event.description, config.descriptionMaxLength);

    if (description) {
      lines.push("> └ " + description);
    }
  }

  return lines;
}

// 1日分の見出しと予定一覧を組み立てる。
function buildCalendarReminderSectionLines_(config, targetDate, title, events) {
  const lines = ["## " + title, "### " + formatJapaneseDate_(targetDate), ""];

  if (!events || events.length === 0) {
    lines.push("予定はありません。");
  } else {
    events.forEach(function(event, index) {
      if (index !== 0) {
        lines.push("");
      }

      buildCalendarEventLines_(config, event).forEach(function(line) {
        lines.push(line);
      });
    });
  }

  lines.push("", buildCalendarDayLinkMarkdown_(config, targetDate));
  return lines;
}

// 複数日の通知セクションを1通のメッセージにまとめる。
function buildCombinedCalendarReminderMessage_(config, sections) {
  return sections
    .map(function(section) {
      return buildCalendarReminderSectionLines_(
        config, section.targetDate, section.title, section.events
      ).join("\n");
    })
    .join("\n\n---\n\n");
}
