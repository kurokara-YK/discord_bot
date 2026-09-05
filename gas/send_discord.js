/****************************************************
 * send_discord.gs
 * ==================================================
 * Discord Webhook へのメッセージ送信
 ****************************************************/

// Discord Webhook に本文を POST する。
function send_discord(webhookUrl, content) {
  if (!webhookUrl) {
    throw new Error("send_discord: webhookUrl がありません。");
  }

  if (!content) {
    throw new Error("send_discord: content がありません。");
  }

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ content: content, tts: false }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(webhookUrl, options);
  const statusCode = response.getResponseCode();

  if (statusCode < 200 || statusCode >= 300) {
    Logger.log("send_discord: responseText = " + response.getContentText());
    throw new Error(
      "send_discord: Discord送信に失敗しました。status=" + statusCode +
      " / Webhook URL が正しいか，削除されていないか確認してください。"
    );
  }

  Logger.log("send_discord: 送信しました。status=" + statusCode);
}
