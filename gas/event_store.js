/****************************************************
 * event_store.gs
 * ==================================================
 * 処理済みのイベントを覚えて，二重通知を防ぐ
 *
 * HF は失敗した配信を再送する。本来は Webhook-Id ヘッダが
 * 冪等キーになるが，GAS はヘッダを読めないため ref と SHA で判定する。
 * スクリプト プロパティは 1値 9KB までのため，キーは短くする。
 ****************************************************/

// 保存キー。
const PROCESSED_EVENTS_PROPERTY_KEY = "PROCESSED_EVENTS";

// 覚えておく件数の上限。
// 1件12文字＋区切りで約13バイト。200件でも約2.6KBに収まる。
const PROCESSED_EVENTS_MAX_COUNT = 200;

// 1件分の識別子を作る。
//
// 削除イベントは newSha が空になる。ref 名だけで作ると
// 「作って消す」を繰り返したときに毎回同じキーになり，
// 2回目以降の削除が通知されなくなる。
// そのため削除時は oldSha（消える直前のコミット）を使う。
function buildEventKey_(parsed, ref) {
  const sha = ref.isDeleted ? ("del:" + ref.oldSha) : ref.newSha;
  return hashKey_(parsed.repoName + "@" + ref.ref + "@" + sha);
}

// 長いキーを固定長の短い文字列にする。
// 保存量を抑えるためで，暗号用途ではない。
function hashKey_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, text, Utilities.Charset.UTF_8);
  let hex = "";

  // 先頭6バイト（12文字）あれば，200件程度の衝突は事実上起きない。
  for (let i = 0; i < 6; i++) {
    hex += ("0" + (bytes[i] & 0xFF).toString(16)).slice(-2);
  }

  return hex;
}

// 保存済みの一覧を読む。
function loadProcessedEvents_() {
  const stored = PropertiesService.getScriptProperties().getProperty(PROCESSED_EVENTS_PROPERTY_KEY);

  if (isBlank_(stored)) {
    return [];
  }

  // 区切り文字で保存する。JSON より短くなる。
  return String(stored).split(",").filter(function(item) {
    return item !== "";
  });
}

// すでに処理したイベントかどうか。
function isAlreadyProcessed_(key) {
  return loadProcessedEvents_().indexOf(key) !== -1;
}

// 処理済みとして覚える。古いものから捨てる。
function markProcessed_(key) {
  const events = loadProcessedEvents_();

  if (events.indexOf(key) !== -1) {
    return;
  }

  events.push(key);

  const trimmed = events.length > PROCESSED_EVENTS_MAX_COUNT
    ? events.slice(events.length - PROCESSED_EVENTS_MAX_COUNT)
    : events;

  PropertiesService.getScriptProperties()
    .setProperty(PROCESSED_EVENTS_PROPERTY_KEY, trimmed.join(","));
}
