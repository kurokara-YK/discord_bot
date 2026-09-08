/****************************************************
 * settings_resolver.gs
 * ==================================================
 * ユーザー設定を実行用の形へそろえる
 ****************************************************/

// ユーザー設定を読み込み，実行用の形へそろえて返す。
function getHuggingFaceSettings_() {
  const normalized = Object.assign({}, HUGGINGFACE_NOTIFY_SETTINGS);

  normalized.label = normalized.label || "Hugging Face 連携 Discord 通知BOT";
  normalized.webhookUrl = toTrimmed_(normalized.webhookUrl);
  normalized.webhookToken = toTrimmed_(normalized.webhookToken);
  normalized.webAppUrl = toTrimmed_(normalized.webAppUrl);
  normalized.targetRepoTypes = normalizeStringList_(normalized.targetRepoTypes);
  normalized.targetRepos = normalizeStringList_(normalized.targetRepos);
  normalized.notifyPrivateRepos = normalized.notifyPrivateRepos !== false;
  normalized.showAuthor = normalized.showAuthor !== false;
  normalized.fetchCommitDetails = normalized.fetchCommitDetails !== false;
  normalized.commitMessageMaxLength = Math.max(0, toIntegerOrDefault_(normalized.commitMessageMaxLength, 100));
  normalized.notifyPullRequestRefs = normalized.notifyPullRequestRefs === true;
  normalized.notifyOnDelete = normalized.notifyOnDelete !== false;
  normalized.notifyErrorsToDiscord = normalized.notifyErrorsToDiscord !== false;

  return normalized;
}

// 必須の設定値を取り出す。未設定なら実行させない。
// 未記入のまま動かすと，原因の分かりにくい失敗になるため
// 呼び出し元の名前を添えて止める。
function requireSetting_(settings, key, callerName, hint) {
  const value = toTrimmed_(settings[key]);

  if (!value || value.indexOf("ここに") !== -1) {
    throw new Error(callerName + ": " + hint);
  }

  return value;
}

// Discord Webhook URL を検証して返す。
function getDiscordWebhookUrl_(settings, callerName) {
  return requireSetting_(settings, "webhookUrl", callerName,
    "Discord Webhook URL が未設定です。config_huggingface.js を確認してください。");
}

// 合言葉を検証して返す。
function getWebhookToken_(settings, callerName) {
  return requireSetting_(settings, "webhookToken", callerName,
    "webhookToken が未設定です。config_huggingface.js を確認してください。");
}

// HF アクセストークンを読む。
// スクリプト プロパティを優先し，無ければ config の値を使う。
// 未設定でもエラーにしない。public リポジトリだけなら不要なため。
function getHuggingFaceAccessToken_() {
  const saved = toTrimmed_(PropertiesService.getScriptProperties().getProperty(HUGGINGFACE_TOKEN_PROPERTY_KEY));

  if (saved) {
    return saved;
  }

  const configured = toTrimmed_(HUGGINGFACE_ACCESS_TOKEN);
  return configured.indexOf("ここに") === -1 ? configured : "";
}
