/****************************************************
 * utils.gs
 * ==================================================
 * 小さい共通関数
 ****************************************************/

// 空欄相当の値かどうかをそろえて判定する。
function isBlank_(value) {
  return value === "" || value === null || value === undefined;
}

// 数値設定が空なら既定値へ寄せる。
function toIntegerOrDefault_(value, defaultValue) {
  if (isBlank_(value)) {
    return defaultValue;
  }

  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// カンマ区切りや配列を重複なしの文字列配列へ正規化する。
function normalizeStringList_(value) {
  if (value === false || isBlank_(value)) {
    return [];
  }

  const source = Array.isArray(value) ? value : String(value).split(",");
  const normalized = [];

  source.forEach(function(item) {
    if (isBlank_(item)) {
      return;
    }

    const text = String(item).trim();

    if (text && normalized.indexOf(text) === -1) {
      normalized.push(text);
    }
  });

  return normalized;
}

// ラベル名フィルタをユーザー設定から読みやすい形へ整える。
function normalizeLabelFilterList_(targetEventLabels) {
  return normalizeStringList_(targetEventLabels);
}

// 対象日比較のために時刻を 00:00 にそろえる。
function normalizeToDayStart_(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

// 今日を基準に日数オフセットした日付を作る。
function getTargetDateByOffsetDays_(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

// イベント一覧を開始時刻と件名の順で安定ソートする。
function sortCalendarEvents_(events) {
  return events.slice().sort(function(a, b) {
    const startDiff = a.startTime.getTime() - b.startTime.getTime();

    if (startDiff !== 0) {
      return startDiff;
    }

    if (a.title === b.title) {
      return 0;
    }

    return a.title < b.title ? -1 : 1;
  });
}

// 表示文字が何も残らない予定は通知対象から外す。
function shouldNotifyCalendarEvent_(event) {
  return !!((event.title || "").trim() || (event.description || "").trim());
}

// ログ用の日付キーを共通形式で出す。
function formatDateKey_(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), "yyyy/MM/dd");
}

// カレンダーリンクの表示形式を既定値へそろえる。
function normalizeCalendarLinkView_(value) {
  const allowed = ["day", "week", "month", "year"];
  const normalized = String(isBlank_(value) ? "" : value).trim().toLowerCase();

  return allowed.indexOf(normalized) === -1 ? "day" : normalized;
}
