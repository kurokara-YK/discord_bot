/****************************************************
 * send_discord.gs
 * ==================================================
 * Discord Webhook にメッセージを送信する
 ****************************************************/

// Discord Webhook に本文を POST する。
function send_discord(webhookUrl, content) {
  if (!webhookUrl) {
    throw new Error("send_discord: webhookUrl がありません。");
  }

  if (!content) {
    throw new Error("send_discord: content がありません。");
  }

  const message = {
    content: content,
    tts: false
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(message),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(webhookUrl, options);
  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  Logger.log("send_discord: statusCode = " + statusCode);
  Logger.log("send_discord: responseText = " + responseText);

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error("send_discord: Discord送信に失敗しました。status=" + statusCode);
  }

  Logger.log("send_discord: Discord送信に成功しました。");
}
