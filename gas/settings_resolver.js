/****************************************************
 * settings_resolver.gs
 * ==================================================
 * config_english.js の設定値を検証し，実行用の設定へ整える
 *
 * 未入力や表記ゆれをここで吸収するため，
 * 他のファイルは設定値がそろっている前提で書ける。
 ****************************************************/

// 設定値が未入力だったときに使う既定値。
const ENGLISH_LEARNING_DEFAULTS = {
  label: "英語学習 Discord BOT",
  templateFileName: "English Learning Sheet",
  sentenceSheetName: "sentences",
  batchSize: 1,
  startNumber: 1,
  sendIntervalMs: 1000,
  sentenceLinkLabel: "🔊 全文を聞く",
  translateSourceLang: "en",
  translateTargetLang: "ja",
  messageTitlePrefix: "英語復習",
  discordMessageMaxLength: 1800
};

// ユーザー設定を読み込み，実行用の設定オブジェクトへ整える。
function getEnglishLearningSettings_() {
  if (typeof ENGLISH_LEARNING_SETTINGS === "undefined" || !ENGLISH_LEARNING_SETTINGS) {
    throw new Error(
      "getEnglishLearningSettings_: 設定が見つかりません。" +
      "config_english.js を作成し，ENGLISH_LEARNING_SETTINGS を定義してください。"
    );
  }

  const source = ENGLISH_LEARNING_SETTINGS;
  const defaults = ENGLISH_LEARNING_DEFAULTS;

  return {
    label: toTrimmedStringOrDefault_(source.label, defaults.label),
    webhookUrl: toTrimmedStringOrDefault_(source.webhookUrl, ""),
    spreadsheetId: extractGoogleDocumentId_(source.spreadsheetId, "spreadsheets/d"),
    templateFolderId: extractGoogleDocumentId_(source.templateFolderId, "folders"),
    templateFileName: toTrimmedStringOrDefault_(source.templateFileName, defaults.templateFileName),
    sentenceSheetName: toTrimmedStringOrDefault_(source.sentenceSheetName, defaults.sentenceSheetName),
    batchSize: toIntegerAtLeast_(source.batchSize, defaults.batchSize, 1),
    startNumber: toIntegerAtLeast_(source.startNumber, defaults.startNumber, 1),
    sendMode: normalizeSendMode_(source.sendMode),
    allowedTimeRanges: normalizeAllowedTimeRanges_(source.allowedTimeRanges),
    sendIntervalMs: toIntegerAtLeast_(source.sendIntervalMs, defaults.sendIntervalMs, 0),
    chunkLinkEnabled: toBoolean_(source.chunkLinkEnabled, true),
    sentenceLinkEnabled: toBoolean_(source.sentenceLinkEnabled, true),
    sentenceLinkLabel: toTrimmedStringOrDefault_(source.sentenceLinkLabel, defaults.sentenceLinkLabel),
    translateSourceLang: toTrimmedStringOrDefault_(source.translateSourceLang, defaults.translateSourceLang),
    translateTargetLang: toTrimmedStringOrDefault_(source.translateTargetLang, defaults.translateTargetLang),
    messageTitlePrefix: toTrimmedStringOrDefault_(source.messageTitlePrefix, defaults.messageTitlePrefix),
    discordMessageMaxLength: toIntegerAtLeast_(source.discordMessageMaxLength, defaults.discordMessageMaxLength, 200)
  };
}

// 設定値がまだ「ここに〜を入れてください」のままかどうかを判定する。
// 書き換え忘れを，Google の分かりにくいエラーより先に検出するために使う。
function isEnglishLearningPlaceholder_(value) {
  return String(value || "").indexOf("ここに") === 0;
}

// Webhook URL を検証して返す。
// 未入力，またはひな形の説明文が残ったままの場合はエラーにする。
function getEnglishLearningWebhookUrl_(settings, callerName) {
  const webhookUrl = settings.webhookUrl;

  if (!webhookUrl || webhookUrl.indexOf("https://") !== 0) {
    throw new Error(
      callerName + ": Discord Webhook URL が未設定です。" +
      "config_english.js の webhookUrl に，https:// から始まる Webhook URL を設定してください。"
    );
  }

  return webhookUrl;
}

// 許可時間帯の配列を正規化する。範囲として成立しない要素は捨てる。
function normalizeAllowedTimeRanges_(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(function(range) {
      if (!range) {
        return null;
      }

      const startHour = toIntegerOrDefault_(range.startHour, -1);
      const endHour = toIntegerOrDefault_(range.endHour, -1);
      const isValid = startHour >= 0 && startHour <= 23 &&
        endHour >= 1 && endHour <= 24 &&
        startHour < endHour;

      return isValid ? { startHour: startHour, endHour: endHour } : null;
    })
    .filter(function(range) {
      return range !== null;
    });
}

// 現在時刻が許可時間帯に含まれるかどうかを判定する。
// 時間帯が1つも設定されていない場合は，制限なしとして常に許可する。
function isAllowedEnglishLearningTime_(settings, currentDate) {
  const ranges = settings.allowedTimeRanges || [];

  if (ranges.length === 0) {
    return true;
  }

  const hour = (currentDate || new Date()).getHours();

  return ranges.some(function(range) {
    return hour >= range.startHour && hour < range.endHour;
  });
}
