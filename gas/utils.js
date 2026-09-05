/****************************************************
 * utils.gs
 * ==================================================
 * 共通の小さな関数と，設定値の読み取り
 ****************************************************/

// ---------------------------------------------------
// 値の正規化
// ---------------------------------------------------

// 空欄相当かどうか。当番表では "-" も担当者なしとして扱う。
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

// 名前を突き合わせ用にそろえる。
// 全角空白や連続した空白の違いを吸収する。
// 例: "Taro  Yamada" と "Taro Yamada" を同じ扱いにする。
function normalizeName_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/　/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

// 値を Date へそろえる。読めなければ null。
// "9/17" のように年が無い値は，年度から年を補う。
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

  // 2/30 のような存在しない日付は Date が繰り上げるため弾く。
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

// 表示用に「9月24日」の形へ。
function formatDate_(value, fiscalYear) {
  const date = toDate_(value, fiscalYear);
  return date === null ? "" : Utilities.formatDate(date, TIME_ZONE, "M月d日");
}

// 日付をずらした新しい Date を返す。
function addDays_(date, days) {
  const shifted = new Date(date.getTime());
  shifted.setDate(shifted.getDate() + days);
  return shifted;
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
  if (typeof DUTY_ROSTER_SETTINGS === "undefined" || !DUTY_ROSTER_SETTINGS) {
    throw new Error("設定が見つかりません。config_roster.js を確認してください。");
  }

  const s = DUTY_ROSTER_SETTINGS;

  return {
    label: toText_(s.label, "当番リマインド Discord BOT"),

    webhookUrl: toText_(s.webhookUrl, ""),
    spreadsheetId: extractId_(s.spreadsheetId, "spreadsheets/d"),
    templateFolderId: extractId_(s.templateFolderId, "folders"),

    fileName: toText_(s.fileName, "当番表"),
    rosterSheetName: toText_(s.rosterSheetName, "当番表"),
    memberSheetName: toText_(s.memberSheetName, "名簿"),
    assigneeColumnCount: toIntegerAtLeast_(s.assigneeColumnCount, 8, 1),
    rosterRowCount: toIntegerAtLeast_(s.rosterRowCount, 20, 1),

    fiscalYear: {
      startYear: toIntegerAtLeast_(s.fiscalStartYear, 0, 0),
      startMonth: toIntegerAtLeast_(s.fiscalStartMonth, 4, 1)
    },
    noticeOffsetDays: toIntegerAtLeast_(s.noticeOffsetDays, 7, 0),

    // 文面は messages.js から読む。config には文面を書かない。
    messages: resolveMessages_(s.messageSet)
  };
}

// messages.js の文面を読み，抜けている項目を雛形で補う。
function resolveMessages_(messageSet) {
  const source = getMessages_(messageSet);
  const fallback = MESSAGES.template;

  return {
    assigneeMessageTemplate: toText_(
      source.assigneeMessageTemplate, fallback.assigneeMessageTemplate
    ),

    // 改行で始まるため trim せずそのまま使う。
    contentSuffixTemplate: source.contentSuffixTemplate === undefined
      ? fallback.contentSuffixTemplate : String(source.contentSuffixTemplate),

    eventMessageTemplate: toText_(
      source.eventMessageTemplate, fallback.eventMessageTemplate
    ),
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
      "config_roster.js の webhookUrl に，https:// から始まるURLを設定してください。"
    );
  }

  return settings.webhookUrl;
}
