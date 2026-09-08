/****************************************************
 * webhook_verify.gs
 * ==================================================
 * リクエストが本物かどうかを合言葉で確かめる
 *
 * GAS はヘッダを読めず X-Webhook-Secret が使えないため，
 * 登録URLへ ?token=... を付けて照合する。
 ****************************************************/

// 合言葉が一致するかどうかを返す。一致しなければ本文を読まない。
function verifyWebhookRequest_(e, settings) {
  const expected = getWebhookToken_(settings, "verifyWebhookRequest_");
  const received = (e && e.parameter && e.parameter.token) ? e.parameter.token : "";

  if (!received) {
    Logger.log("verifyWebhookRequest_: token がありません。破棄します。");
    return false;
  }

  if (!safeEquals_(received, expected)) {
    Logger.log("verifyWebhookRequest_: token が一致しません。破棄します。");
    return false;
  }

  return true;
}
