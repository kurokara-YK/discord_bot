/****************************************************
 * utils.gs
 * ==================================================
 * 小さい共通関数
 ****************************************************/

// 空欄相当の値かどうかをそろえて判定する。
function isBlank_(value) {
  return value === "" || value === null || value === undefined;
}

// null や undefined を空文字にそろえて文字列にする。
// 各所で同じ三項演算子を書いていたためここへまとめた。
function toText_(value) {
  return isBlank_(value) ? "" : String(value);
}

// 前後の空白を落とした文字列にする。
function toTrimmed_(value) {
  return toText_(value).trim();
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
    const text = toTrimmed_(item);

    if (text && normalized.indexOf(text) === -1) {
      normalized.push(text);
    }
  });

  return normalized;
}

// 長い本文を指定文字数で切り詰める。
function truncateText_(value, maxLength) {
  const text = toTrimmed_(value);

  if (maxLength <= 0 || text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength) + "…";
}

// コミットメッセージは1行目だけを件名として扱う。
function firstLineOf_(value) {
  return toText_(value).split("\n")[0].trim();
}

// SHA は先頭7桁だけ表示する。
function shortSha_(sha) {
  return toText_(sha).slice(0, 7);
}

// ログ用に日時を共通形式で出す。
function formatDateTime_(value) {
  return Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm");
}

// 長さに依存しない文字列比較。合言葉の照合に使う。
function safeEquals_(a, b) {
  const left = toText_(a);
  const right = toText_(b);

  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let i = 0; i < left.length; i++) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return diff === 0;
}

// repo.type から API のパス断片を作る。model → models
function repoTypeToApiSegment_(repoType) {
  const type = toTrimmed_(repoType).toLowerCase();
  return (type || "model") + "s";
}

// ref の接頭辞の対応表。表示名と種類の判定を1か所にまとめる。
const REF_PREFIXES = [
  { prefix: "refs/heads/", kind: "branch" },
  { prefix: "refs/tags/", kind: "tag" },
  { prefix: "refs/pr/", kind: "pr" }
];

// 種類ごとの日本語表記。通知の文面で使う。
const REF_KIND_LABELS = {
  branch: "ブランチ",
  tag: "タグ",
  pr: "プルリクエスト",
  other: "ブランチ"
};

// refs/heads/main → { name: "main", kind: "branch" } のように分解する。
// 以前は表示名と種類で同じ判定を二度書いていた。
function parseRef_(ref) {
  const text = toTrimmed_(ref);

  for (let i = 0; i < REF_PREFIXES.length; i++) {
    const entry = REF_PREFIXES[i];

    if (text.indexOf(entry.prefix) === 0) {
      return { name: text.slice(entry.prefix.length), kind: entry.kind };
    }
  }

  return { name: text, kind: "other" };
}
