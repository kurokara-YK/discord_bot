/****************************************************
 * utils.gs
 * ==================================================
 * 複数のファイルから使う小さな共通関数
 ****************************************************/

// ---------------------------------------------------
// 値の正規化
// ---------------------------------------------------

// 空欄相当の値かどうかをそろえて判定する。
function isBlank_(value) {
  return value === "" || value === null || value === undefined;
}

// 文字列設定が空なら既定値へ寄せ，そうでなければ前後の空白を落とす。
function toTrimmedStringOrDefault_(value, defaultValue) {
  if (isBlank_(value)) {
    return defaultValue;
  }

  const text = String(value).trim();
  return text === "" ? defaultValue : text;
}

// 数値設定が空または数値でなければ既定値へ寄せる。
function toIntegerOrDefault_(value, defaultValue) {
  if (isBlank_(value)) {
    return defaultValue;
  }

  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// 下限を持つ整数設定を解決する。
function toIntegerAtLeast_(value, defaultValue, minimum) {
  return Math.max(minimum, toIntegerOrDefault_(value, defaultValue));
}

// 各種真偽値を boolean にそろえる。
function toBoolean_(value, defaultValue) {
  if (typeof value === "boolean") {
    return value;
  }

  if (isBlank_(value)) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

// 送信方法を正規化する。random 以外はすべて sequential として扱う。
function normalizeSendMode_(value) {
  return String(value || "").trim().toLowerCase() === "random" ? "random" : "sequential";
}

// Google のドキュメント URL から ID 部分だけを取り出す。
// ID をそのまま貼り付けた場合は，その値をそのまま返す。
function extractGoogleDocumentId_(value, pathKeyword) {
  if (isBlank_(value)) {
    return "";
  }

  const text = String(value).trim();
  const matched = text.match(new RegExp("/" + pathKeyword + "/([a-zA-Z0-9-_]+)"));

  return matched && matched[1] ? matched[1] : text;
}

// ---------------------------------------------------
// チャンク文字列
// ---------------------------------------------------

// チャンク文字列を配列へ分解する。空のチャンクは取り除く。
function splitChunkText_(text) {
  return String(text || "")
    .split(ENGLISH_LEARNING_CHUNK_SEPARATOR)
    .map(function(part) {
      return part.trim();
    })
    .filter(function(part) {
      return part !== "";
    });
}

// チャンク表示の区切りを見やすく整える。
function normalizeChunkText_(text) {
  return splitChunkText_(text).join(ENGLISH_LEARNING_CHUNK_DISPLAY_SEPARATOR);
}

// ---------------------------------------------------
// Discord / Google翻訳 のリンク
// ---------------------------------------------------

// URL クエリ用に文字列をエンコードする。
// encodeURIComponent が素通しする ! ' ( ) * も必ずエンコードする。
// Discord のリンク記法 [表示名](<URL>) は URL 内の ) でリンクが切れるため。
function encodeForUrlComponent_(text) {
  return encodeURIComponent(String(text || "")).replace(/[!'()*]/g, function(character) {
    return "%" + character.charCodeAt(0).toString(16).toUpperCase();
  });
}

// 本文を入力済みにした Google翻訳の URL を作る。
function buildGoogleTranslateUrl_(text, sourceLang, targetLang) {
  const baseUrl = "https://translate.google.com/?sl=" + (sourceLang || "en") +
    "&tl=" + (targetLang || "ja") + "&op=translate";
  const value = String(text || "").trim();

  return value ? baseUrl + "&text=" + encodeForUrlComponent_(value) : baseUrl;
}

// Discord のリンク表示名に使えない記号をエスケープする。
function escapeDiscordLinkLabel_(label) {
  return String(label || "").replace(/([\[\]])/g, "\\$1");
}

// Discord のリンク記法を作る。<> で囲んで URL プレビューを抑制する。
function buildDiscordMaskedLink_(label, url) {
  return "[" + escapeDiscordLinkLabel_(label) + "](<" + url + ">)";
}

// ---------------------------------------------------
// 配列
// ---------------------------------------------------

// 指定番号以上で最初に一致する要素位置を返す。見つからなければ -1。
// entries は No. の昇順に並んでいる前提。
function findEnglishLearningEntryIndexByNumber_(entries, number) {
  for (let i = 0; i < entries.length; i += 1) {
    if (entries[i].number >= number) {
      return i;
    }
  }

  return -1;
}

// Fisher-Yates で配列をシャッフルする。元の配列は変更しない。
function shuffleArray_(items) {
  const array = items.slice();

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}
