/****************************************************
 * utils.gs
 * ==================================================
 * 共通の小さな関数と，設定値の読み取り
 ****************************************************/

// ---------------------------------------------------
// 値の正規化
// ---------------------------------------------------

// 空欄相当か。"-" も担当者なしとして扱う。
function isEmptyCell_(value) {
  if (value === null || value === undefined) {
    return true;
  }

  const text = String(value).trim();
  return text === "" || text === "-";
}

// 文字列設定を整える。空なら既定値へ寄せる。
function toText_(value, defaultValue) {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const text = String(value).trim();
  return text === "" ? defaultValue : text;
}

// 整数設定を整える。下限つき。
function toIntegerAtLeast_(value, defaultValue, minimum) {
  const parsed = parseInt(String(value), 10);
  return Math.max(minimum, isNaN(parsed) ? defaultValue : parsed);
}

// Google の URL から ID を取り出す。ID をそのまま渡してもよい。
function extractId_(value, pathKeyword) {
  const text = String(value === null || value === undefined ? "" : value).trim();
  const matched = text.match(new RegExp("/" + pathKeyword + "/([a-zA-Z0-9-_]+)"));

  return matched && matched[1] ? matched[1] : text;
}

// 「ここに〜を入れてください」のまま残っているかどうか。
function isPlaceholder_(value) {
  return String(value || "").indexOf("ここに") === 0;
}

// 名前を突き合わせ用にそろえる。全角空白や連続した空白の違いを吸収する。
function normalizeName_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/　/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// チェックボックスの値を真偽へそろえる。手書きの "TRUE" も受ける。
function toBoolean_(value) {
  if (value === true) {
    return true;
  }

  return String(value === null || value === undefined ? "" : value)
    .trim().toUpperCase() === "TRUE";
}

// 列記号を 0始まりの index へ変換する。例: A -> 0, M -> 12
function colIndex_(colLetter) {
  const upper = String(colLetter).trim().toUpperCase();
  let num = 0;

  for (let i = 0; i < upper.length; i += 1) {
    num = num * 26 + (upper.charCodeAt(i) - 64);
  }

  return num - 1;
}

// ---------------------------------------------------
// 日付
// ---------------------------------------------------

// 値を Date へそろえる。"11/1" のように年が無ければ年度から補う。
function toDate_(value, fiscalYear) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  if (text === "" || text === "-") {
    return null;
  }

  const monthDay = text.match(/^(\d{1,2})\s*[\/\-月]\s*(\d{1,2})日?$/);

  if (monthDay) {
    return buildFiscalDate_(parseInt(monthDay[1], 10), parseInt(monthDay[2], 10), fiscalYear);
  }

  const parsed = new Date(text.replace(/-/g, "/"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

// 月日と年度から Date を作る。年度開始月より前の月は翌年になる。
function buildFiscalDate_(month, day, fiscalYear) {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const startYear = toIntegerAtLeast_(fiscalYear && fiscalYear.startYear, 0, 0);

  if (startYear <= 0) {
    return null;
  }

  const startMonth = Math.min(12, toIntegerAtLeast_(fiscalYear && fiscalYear.startMonth, 4, 1));
  const year = month >= startMonth ? startYear : startYear + 1;
  const date = new Date(year, month - 1, day);

  // 2/30 のような日付は Date が繰り上げるため弾く。
  const isSame = date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isSame ? date : null;
}

// 日付を時刻抜きの yyyy-MM-dd にそろえる。比較用。
function toDateKey_(value, fiscalYear) {
  const date = toDate_(value, fiscalYear);
  return date === null ? null : Utilities.formatDate(date, TIME_ZONE, "yyyy-MM-dd");
}

// 表示用に「11月2日」の形へ。
function formatDate_(value, fiscalYear) {
  const date = toDate_(value, fiscalYear);
  return date === null ? "" : Utilities.formatDate(date, TIME_ZONE, "M月d日");
}

// 表示用に「11月2日(月)」の形へ。
const WEEKDAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function formatDateWithWeekday_(value, fiscalYear) {
  const date = toDate_(value, fiscalYear);

  if (date === null) {
    return "";
  }

  return Utilities.formatDate(date, TIME_ZONE, "M月d日") +
    "(" + WEEKDAY_NAMES[date.getDay()] + ")";
}

// ---------------------------------------------------
// 時刻
// ---------------------------------------------------

// 分数を "9:00" の形へ。
function formatMinutesOfDay_(minutes) {
  if (minutes === null || minutes === undefined) {
    return "";
  }

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return hour + ":" + (minute < 10 ? "0" + minute : String(minute));
}

// 「時」と「分」から「0時からの分数」を作る。読めなければ null。
// "09" と 9 のどちらも受ける。
function buildMinutesOfDay_(hourValue, minuteValue) {
  if (isEmptyCell_(hourValue)) {
    return null;
  }

  const hour = parseInt(String(hourValue).trim(), 10);

  // 分が空なら 0分。時だけ選んで分を選び忘れても読めるようにするため。
  const minute = isEmptyCell_(minuteValue)
    ? 0 : parseInt(String(minuteValue).trim(), 10);

  if (isNaN(hour) || isNaN(minute)) {
    return null;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

// 数値を2桁の文字列にする。例: 9 -> "09"
function padNumber_(value) {
  return value < 10 ? "0" + value : String(value);
}

// 日付と「0時からの分数」から Date を作る。
function buildDateTime_(date, minutesOfDay) {
  if (date === null || minutesOfDay === null) {
    return null;
  }

  const built = new Date(date.getTime());

  // setMinutes は 24時以降を翌日へ繰り上げる。
  built.setHours(0, 0, 0, 0);
  built.setMinutes(minutesOfDay);

  return built;
}

// 2つの Date の差を分で返す。to が後なら正の数。
function diffMinutes_(from, to) {
  return Math.round((to.getTime() - from.getTime()) / 60000);
}

// テンプレートの {key} を置き換える。対応が無い {key} は空文字になる。
function applyTemplate_(template, values) {
  return String(template || "").replace(/\{(\w+)\}/g, function(match, key) {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : "";
  });
}

// ---------------------------------------------------
// 設定
// ---------------------------------------------------

// 設定を読み込み，検証して返す。
function getSettings_() {
  if (typeof EVENT_SHIFT_SETTINGS === "undefined" || !EVENT_SHIFT_SETTINGS) {
    throw new Error("設定が見つかりません。config_shift.js を確認してください。");
  }

  const s = EVENT_SHIFT_SETTINGS;
  const notifications = s.notifications || {};
  const triggerMinutes = resolveTriggerMinutes_(notifications.triggerMinutes);

  return {
    label: toText_(s.label, "イベントシフト リマインド Discord BOT"),

    webhookUrl: toText_(s.webhookUrl, ""),
    spreadsheetId: extractId_(s.spreadsheetId, "spreadsheets/d"),
    templateFolderId: extractId_(s.templateFolderId, "folders"),

    fileName: toText_(s.fileName, "シフト表"),
    scheduleSheetName: toText_(s.scheduleSheetName, "日程"),
    shiftSheetName: toText_(s.shiftSheetName, "シフト表"),
    memberSheetName: toText_(s.memberSheetName, "名簿"),
    assigneeColumnCount: toIntegerAtLeast_(s.assigneeColumnCount, 8, 1),
    minuteStep: resolveMinuteStep_(s.minuteStep),

    fiscalYear: {
      startYear: toIntegerAtLeast_(s.fiscalStartYear, 0, 0),
      startMonth: toIntegerAtLeast_(s.fiscalStartMonth, 4, 1)
    },

    notifications: {
      // 並び順の正規化は columns_def.js と同じ関数を使う。
      // 列の順と判定の順がずれると，別の列へチェックが入ってしまう。
      beforeMinutes: normalizeBeforeMinutes_(notifications.beforeMinutes),
      includeCurrentShift: notifications.includeCurrentShift !== false,
      triggerMinutes: triggerMinutes,
      toleranceMinutes: resolveToleranceMinutes_(notifications.toleranceMinutes, triggerMinutes),

    },

    // 文面は messages.js から読む。config には文面を書かない。
    messages: resolveMessages_(s.messageSet)
  };
}

// 分プルダウンの刻みを整える。
// 60を割り切れないと 00分に戻らない候補ができるため 15 に寄せる。
function resolveMinuteStep_(value) {
  const step = toIntegerAtLeast_(value, 15, 1);
  return 60 % step === 0 ? step : 15;
}

// トリガーの間隔を整える。
// everyMinutes が受け付けるのは 1・5・10・15・30 だけ。
const TRIGGER_MINUTE_CHOICES = [1, 5, 10, 15, 30];

function resolveTriggerMinutes_(value) {
  const minutes = toIntegerAtLeast_(value, 15, 1);

  if (TRIGGER_MINUTE_CHOICES.indexOf(minutes) >= 0) {
    return minutes;
  }

  // 指定を超えない最大のものへ。粗いと通知を取りこぼすため細かいほうへ倒す。
  let chosen = TRIGGER_MINUTE_CHOICES[0];

  TRIGGER_MINUTE_CHOICES.forEach(function(choice) {
    if (choice <= minutes) {
      chosen = choice;
    }
  });

  return chosen;
}

// 判定の幅を整える。
//
// トリガーの間隔の半分より狭いと，「n分前」の窓から外れて通知が飛ばない。
// 狭い設定はそのまま使わず広げる。飛ばないより多少ずれるほうがましなため。
function resolveToleranceMinutes_(value, triggerMinutes) {
  const needed = Math.ceil(triggerMinutes / 2);
  return Math.max(toIntegerAtLeast_(value, needed, 1), needed);
}

// 文面を読み，抜けている項目を雛形で補う。
function resolveMessages_(messageSet) {
  const source = getMessages_(messageSet);
  const fallback = MESSAGES.template;

  // 改行で始まる項目は trim しない。
  const keepAsIs = function(key) {
    return source[key] === undefined ? fallback[key] : String(source[key]);
  };

  return {
    beforeMessageTemplate: toText_(
      source.beforeMessageTemplate, fallback.beforeMessageTemplate
    ),
    imminentMessageTemplate: toText_(
      source.imminentMessageTemplate, fallback.imminentMessageTemplate
    ),
    currentShiftSuffixTemplate: keepAsIs("currentShiftSuffixTemplate"),
    memoSuffixTemplate: keepAsIs("memoSuffixTemplate"),

    summaryHeaderTemplate: toText_(
      source.summaryHeaderTemplate, fallback.summaryHeaderTemplate
    ),
    summaryLineTemplate: toText_(
      source.summaryLineTemplate, fallback.summaryLineTemplate
    ),
    summarySlotSeparator: toText_(
      source.summarySlotSeparator, fallback.summarySlotSeparator
    ),
    summaryFooterTemplate: keepAsIs("summaryFooterTemplate"),
    summaryEmptyTemplate: toText_(
      source.summaryEmptyTemplate, fallback.summaryEmptyTemplate
    ),

    closingMessageTemplate: toText_(
      source.closingMessageTemplate, fallback.closingMessageTemplate
    ),
    closingAssigneesSuffixTemplate: keepAsIs("closingAssigneesSuffixTemplate"),

    unknownMemberTemplate: toText_(
      source.unknownMemberTemplate, fallback.unknownMemberTemplate
    ),
    assigneeSeparator: toText_(
      source.assigneeSeparator, fallback.assigneeSeparator
    )
  };
}

// Webhook URL を検証して返す。
function getWebhookUrl_(settings) {
  if (!settings.webhookUrl || settings.webhookUrl.indexOf("https://") !== 0) {
    throw new Error(
      "Discord Webhook URL が未設定です。" +
      "config_shift.js の webhookUrl に，https:// から始まるURLを設定してください。"
    );
  }

  return settings.webhookUrl;
}
