/****************************************************
 * main.gs
 * ==================================================
 * Hugging Face 通知BOT のエントリーポイント
 *
 * Apps Script の「実行する関数」に出るのは，このファイルの関数だけ。
 * 末尾が _ の関数は内部用のため一覧に出ない。
 *
 * このBOTにトリガーは設定しない。
 * Hugging Face から POST が届いたときだけ doPost が動く。
 ****************************************************/

// HF からの POST を受け取る入口。
// 例外を投げると HF が再送を繰り返すため，必ず 200 を返す。
function doPost(e) {
  try {
    const settings = getHuggingFaceSettings_();

    // 合言葉が違えば本文を読まずに終わる。
    if (verifyWebhookRequest_(e, settings)) {
      const payload = parseRequestBody_(e);

      if (payload) {
        processHuggingFacePayload_(payload, settings);
      }
    }
  } catch (error) {
    Logger.log("doPost: 処理に失敗しました。" + error.message);
    notifyErrorSafely_(error);
  }

  return ContentService.createTextOutput("ok");
}

// 解析済みの本文を通知へつなげる。テスト関数からも使う。
function processHuggingFacePayload_(payload, settings) {
  const parsed = parseHuggingFacePayload_(payload);

  if (!parsed || !shouldNotifyEvent_(parsed, settings)) {
    return;
  }

  // 再送で同じ通知が二度出ないようにする。
  const refs = selectNotifiableRefs_(parsed, settings).filter(function(ref) {
    if (isAlreadyProcessed_(buildEventKey_(parsed, ref))) {
      Logger.log("processHuggingFacePayload_: 処理済みのため飛ばします。" + ref.name);
      return false;
    }

    return true;
  });

  if (refs.length === 0) {
    Logger.log("processHuggingFacePayload_: 送信対象はありません。");
    return;
  }

  // 作者名などを補う。取れなくても通知は止めない。
  const commitInfoMap = {};

  refs.forEach(function(ref) {
    commitInfoMap[ref.ref] = fetchCommitInfo_(parsed, ref, settings);
  });

  const content = buildHuggingFaceMessage_(parsed, refs, commitInfoMap, settings);

  if (!content) {
    return;
  }

  send_discord(getDiscordWebhookUrl_(settings, "processHuggingFacePayload_"), content);

  // 送信に成功してから覚える。
  // 先に覚えると，送信が失敗したときに通知されないまま処理済みになる。
  refs.forEach(function(ref) {
    markProcessed_(buildEventKey_(parsed, ref));
  });

  Logger.log("送信しました。" + parsed.repoName + " refs=" + refs.length);
}

// エラー通知そのものが失敗しても握りつぶす。
function notifyErrorSafely_(error) {
  try {
    const settings = getHuggingFaceSettings_();

    if (settings.notifyErrorsToDiscord) {
      send_discord(getDiscordWebhookUrl_(settings, "notifyErrorSafely_"), buildErrorMessage_(error.message));
    }
  } catch (ignored) {
    Logger.log("notifyErrorSafely_: エラー通知にも失敗しました。");
  }
}

// ---------------------------------------------------
// ここから下は手動で実行して確認するための関数
// ---------------------------------------------------

// 【手順1】合言葉を発行する。設定済みなら作り直さない。
function step1_make_token() {
  const token = toTrimmed_(HUGGINGFACE_NOTIFY_SETTINGS.webhookToken);

  if (isValidToken_(token)) {
    Logger.log("合言葉は設定済みです（" + token.slice(0, 8) + "…／" + token.length + "文字）。");
    Logger.log("次は step2_show_webhook_url を実行してください。");
    Logger.log("");
    Logger.log("※ 漏れたときなど，作り直す場合のみ step1_remake_token を使います。");
    Logger.log("   作り直すと Hugging Face 側の登録もやり直しになります。");
    return;
  }

  printNewToken_();
}

// 合言葉を作り直す。漏れたときなど，作り直しが必要な場合のみ使う。
function step1_remake_token() {
  Logger.log("合言葉を作り直します。登録済みのURLは使えなくなります。");
  Logger.log("");
  printNewToken_();
}

function printNewToken_() {
  Logger.log("【手順1／2】次の行を config_huggingface.gs に貼り付けて保存する");
  Logger.log("");
  Logger.log('  webhookToken: "' + generateToken_() + '",');
  Logger.log("");
  Logger.log("そのあと「デプロイ」→「新しいデプロイ」→ ウェブアプリ");
  Logger.log("（実行：自分／アクセス：全員）でデプロイし，");
  Logger.log("表示されたURLを config の webAppUrl に貼ってから");
  Logger.log("step2_show_webhook_url を実行してください。");
}

// 【手順2】Hugging Face に登録するURLを表示する。
function step2_show_webhook_url() {
  const token = toTrimmed_(HUGGINGFACE_NOTIFY_SETTINGS.webhookToken);

  if (!isValidToken_(token)) {
    Logger.log("合言葉が未設定です。先に step1_make_token を実行してください。");
    return;
  }

  const execUrl = toExecUrl_(HUGGINGFACE_NOTIFY_SETTINGS.webAppUrl);

  if (!execUrl) {
    Logger.log("config_huggingface.gs の webAppUrl が未設定です。");
    Logger.log("デプロイ画面に出た「ウェブアプリ URL」を貼り付けてください。");
    Logger.log("（「デプロイ」→「デプロイを管理」からも確認できます）");
    Logger.log("");
    Logger.log('  webAppUrl: "https://script.google.com/macros/s/……/exec",');
    return;
  }

  Logger.log("【手順2／2】https://huggingface.co/settings/webhooks で登録する");
  Logger.log("");
  Logger.log("  [Target repositories] kurokara-YK など，監視する対象");
  Logger.log("  [Webhook type]        Webhook URL（Job ではない）");
  Logger.log("  [Secret]              空のまま");
  Logger.log("  [Triggers]            Repo update にチェック");
  Logger.log("");
  Logger.log("  [Webhook URL] 次の1行をそのまま貼り付ける");
  Logger.log("");
  Logger.log("  " + execUrl + "?token=" + token);
  Logger.log("");
  Logger.log("※ Discord の Webhook URL をここへ貼らないこと。");
  Logger.log("※ コード変更後は「デプロイを管理」から既存のデプロイを更新すること。");
  Logger.log("   新規に作るとURLが変わり，登録し直しになります。");
}

// 貼り付けられたURLを /exec の形にそろえる。
// ?token=… まで貼られていても，末尾が /dev でも正しく直す。
function toExecUrl_(value) {
  const pasted = toTrimmed_(value);

  if (!pasted || pasted.indexOf("script.google.com") === -1) {
    return "";
  }

  return pasted.split("?")[0].replace(/\/(dev|exec)\/?$/, "").replace(/\/+$/, "") + "/exec";
}

// 合言葉として使える値か。未設定・説明文のまま・短すぎるものを弾く。
function isValidToken_(token) {
  const text = toTrimmed_(token);
  return text.length >= 32 && /^[0-9a-zA-Z_-]+$/.test(text);
}

// 推測されない合言葉を作る。
function generateToken_() {
  let text = "";

  while (text.length < 64) {
    text += Utilities.getUuid().replace(/-/g, "");
  }

  return text.slice(0, 64);
}

// config の HUGGINGFACE_ACCESS_TOKEN をスクリプト プロパティへ保存する。
// 保存後は config の行を空にしてよい（保存された値が使われる）。
function save_access_token() {
  const token = toTrimmed_(HUGGINGFACE_ACCESS_TOKEN);
  const store = PropertiesService.getScriptProperties();
  const saved = toTrimmed_(store.getProperty(HUGGINGFACE_TOKEN_PROPERTY_KEY));

  if (!token || token.indexOf("ここに") !== -1) {
    if (saved) {
      Logger.log("トークンは保存済みです（" + maskToken_(saved) + "）。");
      Logger.log("入れ替える場合は config に新しい値を貼って再実行してください。");
      Logger.log("削除する場合は delete_access_token を実行してください。");
      return;
    }

    Logger.log("config_huggingface.gs の HUGGINGFACE_ACCESS_TOKEN が未設定です。");
    Logger.log("https://huggingface.co/settings/tokens で発行した値を貼ってください。");
    return;
  }

  if (token.indexOf("hf_") !== 0) {
    Logger.log("hf_ で始まっていません。値を確認してください。");
    return;
  }

  store.setProperty(HUGGINGFACE_TOKEN_PROPERTY_KEY, token);
  Logger.log("保存しました（" + maskToken_(token) + "）。");
  Logger.log("");
  Logger.log("config_huggingface.gs の HUGGINGFACE_ACCESS_TOKEN は空にして構いません。");
  Logger.log("保存した値が使われるため，動作には影響しません。");
}

// 保存したトークンを削除する。
function delete_access_token() {
  PropertiesService.getScriptProperties().deleteProperty(HUGGINGFACE_TOKEN_PROPERTY_KEY);
  Logger.log("保存したトークンを削除しました。");
  Logger.log("config の HUGGINGFACE_ACCESS_TOKEN も空にしてください。");
}

// ログに出すとき用に伏せ字にする。値そのものは出さない。
function maskToken_(token) {
  const text = toTrimmed_(token);
  return text.slice(0, 6) + "…" + text.slice(-4) + "／" + text.length + "文字";
}

// Discord Webhook の接続確認用に固定文面を送る。
function test_send_discord_message() {
  const settings = getHuggingFaceSettings_();
  send_discord(getDiscordWebhookUrl_(settings, "test_send_discord_message"),
    "【テスト送信】Hugging Face 通知BOT からの送信確認です。");
}

// サンプルのペイロードを流し，実際の文面を Discord で確認する。
// 何度でも試せるよう，送信前に処理済みの記録を消す。
function test_huggingface_payload() {
  PropertiesService.getScriptProperties().deleteProperty(PROCESSED_EVENTS_PROPERTY_KEY);
  processHuggingFacePayload_(SAMPLE_HUGGINGFACE_PUSH_PAYLOAD, getHuggingFaceSettings_());
}
