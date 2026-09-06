/****************************************************
 * messages.gs
 * ==================================================
 * Discord へ送る文面
 *
 * MESSAGES に文面のまとまりを定義し，
 * config_shift.js の messageSet で名前を指定して使う。
 *
 * 自分用の文面は template をコピーして別名で足す。
 *
 * 【文面で使える変数】
 *   事前通知   {assignees} {dayLabel} {timeRange} {startTime}
 *              {date} {minutes} {memo} {current}
 *   今日の予定 {dayLabel} {date} {assignee} {slots}
 *   お疲れさま {date} {dayLabel} {assignees}
 *   {name} は unknownMemberTemplate でのみ使う。
 *
 * dayLabel は「 準備の日 7:00〜20:00」のように前に空白が付く。
 ****************************************************/

const MESSAGES = {

  // ================================================
  // template
  // ------------------------------------------------
  // 用途を問わない雛形。
  // これをコピーして自分の文面を作る出発点にする。
  // ================================================
  template: {

    // 事前通知のうち，まだ交代の場面ではないもの。
    // 既定では1時間前がこれにあたる。
    beforeMessageTemplate:
      "【{minutes}分後のシフト】{timeRange}\n" +
      "{assignees}",

    // 事前通知のうち，最も開始が近いもの。
    // 既定では15分前がこれにあたる。
    imminentMessageTemplate:
      "【まもなく交代】{timeRange}\n" +
      "次の担当: {assignees}",

    // 上の文面の末尾へ足す，いま入っている担当者の案内。
    // config の includeCurrentShift が true で，
    // ひとつ前のコマに担当者がいるときだけ足される。
    currentShiftSuffixTemplate:
      "\n現在の担当: {current}",

    // 上の文面の末尾へ足す文面。メモ列が空の枠では足されない。
    memoSuffixTemplate:
      "\nメモ: {memo}",

    // 朝のまとめの1行目。
    summaryHeaderTemplate:
      "【本日のシフト】{date}{dayLabel}",

    // 朝のまとめの，1人ぶんの行。
    summaryLineTemplate:
      "{assignee}\n  {slots}",

    // 1人が複数コマ持つときの，コマのつなぎ文字。
    summarySlotSeparator: " / ",

    // 朝のまとめの末尾へ足す文面。
    summaryFooterTemplate:
      "\nよろしくお願いします。",

    // その日にシフトが1件も無いときの文面。
    summaryEmptyTemplate:
      "本日のシフトはありません。",

    // 業務終了の通知。その日の最終コマが終わったら送る。
    closingMessageTemplate:
      "【本日の業務終了】{date}{dayLabel}\n" +
      "本日の業務は終了です。お疲れさまでした。",

    // 上の文面の末尾へ足す，その日に入った人へのお礼。
    // 担当者が1人もいない日では足されない。
    closingAssigneesSuffixTemplate:
      "\n\n本日の担当: {assignees}",

    // 名簿に Discord ID が無い人の表示。メンションの代わりに使われる。
    unknownMemberTemplate: "{name}（ID未登録）",

    // 担当者が複数いるときの，メンションのつなぎ文字。
    assigneeSeparator: "、"
  },

  // ================================================
  // festival
  // ------------------------------------------------
  // 学園祭・展示会などのイベント運営。
  // 持ち場への移動と，交代の引き継ぎを知らせる。
  // ================================================
  festival: {

    beforeMessageTemplate:
      "【{minutes}分後のシフト】{timeRange}\n" +
      "{assignees}\n" +
      "そろそろ準備をお願いします。",

    imminentMessageTemplate:
      "【まもなく交代】{timeRange}\n" +
      "次の担当: {assignees}\n" +
      "持ち場へ移動をお願いします。",

    currentShiftSuffixTemplate:
      "\n現在の担当: {current} … 引き継ぎをお願いします。",

    memoSuffixTemplate:
      "\nメモ: {memo}",

    summaryHeaderTemplate:
      "【本日のシフト】{date}{dayLabel}",

    summaryLineTemplate:
      "{assignee}\n  {slots}",

    summarySlotSeparator: " / ",

    summaryFooterTemplate:
      "\n体調に気をつけて，よろしくお願いします。",

    summaryEmptyTemplate:
      "本日のシフトはありません。",

    closingMessageTemplate:
      "【本日の業務終了】{date}{dayLabel}\n" +
      "本日の業務は終了です。お疲れさまでした。\n" +
      "片付けと戸締まりをお願いします。",

    closingAssigneesSuffixTemplate:
      "\n\n本日の担当: {assignees}",

    unknownMemberTemplate: "{name}（ID未登録）",

    assigneeSeparator: "、"
  }
};

// messageSet で指定された文面を返す。
// 見つからなければ template を使い警告を出す。止まるより気づきやすい。
function getMessages_(messageSet) {
  const name = String(messageSet || "").trim();

  if (Object.prototype.hasOwnProperty.call(MESSAGES, name)) {
    return MESSAGES[name];
  }

  Logger.log(
    "警告: messageSet \"" + name + "\" は messages.js にありません。" +
    "template の文面を使います。" +
    "指定できるのは: " + Object.keys(MESSAGES).join(", ")
  );

  return MESSAGES.template;
}

// ---------------------------------------------------
// 文面の組み立て
// ---------------------------------------------------

// 事前通知の本文を作る。
function buildNoticeMessage_(settings, target, dayLabel, previousNames, memberMap) {
  const messages = settings.messages;
  const slot = target.slot;

  const values = {
    assignees: buildMentions_(settings, slot.assigneeNames, memberMap),
    dayLabel: dayLabel,
    timeRange: buildTimeRange_(slot),
    startTime: formatMinutesOfDay_(slot.startMinutes),
    date: formatDateWithWeekday_(slot.date, settings.fiscalYear),
    minutes: target.minutes,
    memo: slot.memo,
    current: ""
  };

  let message = applyTemplate_(
    target.isImminent ? messages.imminentMessageTemplate : messages.beforeMessageTemplate,
    values
  );

  // 交代の引き継ぎ案内。直前の通知でだけ足す。
  if (previousNames.length > 0) {
    values.current = buildMentions_(settings, previousNames, memberMap);
    message += applyTemplate_(messages.currentShiftSuffixTemplate, values);
  }

  if (slot.memo !== "") {
    message += applyTemplate_(messages.memoSuffixTemplate, values);
  }

  return message;
}

// 今日の予定の本文を作る。その日ぶんを1通にまとめる。
function buildSummaryMessage_(settings, date, dayLabel, people, memberMap) {
  const messages = settings.messages;

  const headerValues = {
    dayLabel: dayLabel,
    date: formatDateWithWeekday_(date, settings.fiscalYear)
  };

  const lines = [applyTemplate_(messages.summaryHeaderTemplate, headerValues)];

  people.forEach(function(person) {
    const slotTexts = person.slots.map(function(slot) {
      return buildTimeRange_(slot);
    });

    lines.push(applyTemplate_(messages.summaryLineTemplate, {
      assignee: buildMention_(settings, person.name, memberMap),
      slots: slotTexts.join(messages.summarySlotSeparator)
    }));
  });

  return lines.join("\n") + applyTemplate_(messages.summaryFooterTemplate, headerValues);
}

// 業務終了の本文を作る。
function buildClosingMessage_(settings, date, dayLabel, assigneeNames, memberMap) {
  const messages = settings.messages;

  const values = {
    date: formatDateWithWeekday_(date, settings.fiscalYear),
    dayLabel: dayLabel,
    assignees: buildMentions_(settings, assigneeNames, memberMap)
  };

  let message = applyTemplate_(messages.closingMessageTemplate, values);

  if (assigneeNames.length > 0) {
    message += applyTemplate_(messages.closingAssigneesSuffixTemplate, values);
  }

  return message;
}

// 「10:00〜11:00」の形へ。
function buildTimeRange_(slot) {
  return formatMinutesOfDay_(slot.startMinutes) +
    TIME_RANGE_SEPARATOR + formatMinutesOfDay_(slot.endMinutes);
}

// 担当者の一覧をメンションの並びにする。
function buildMentions_(settings, names, memberMap) {
  return names
    .map(function(name) { return buildMention_(settings, name, memberMap); })
    .join(settings.messages.assigneeSeparator);
}

// 担当者名から Discord のメンションを作る。
// ID が無い人は名前だけ出す。消すと誰が担当か分からなくなるため。
function buildMention_(settings, name, memberMap) {
  const discordId = memberMap[normalizeName_(name)];

  if (!isValidDiscordId_(discordId)) {
    return applyTemplate_(settings.messages.unknownMemberTemplate, { name: name });
  }

  return "<@" + String(discordId).trim() + ">";
}

// Discord のユーザーIDとして使えるか。数字だけの文字列。
function isValidDiscordId_(value) {
  return !isEmptyCell_(value) && /^\d+$/.test(String(value).trim());
}
