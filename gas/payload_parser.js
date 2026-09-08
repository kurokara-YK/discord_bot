/****************************************************
 * payload_parser.gs
 * ==================================================
 * HF から届いた JSON を，このBOT内部の形へそろえる
 *
 * ここで取れるのはリポジトリ名・ブランチ・SHA まで。
 * 作者名などは hf_api.gs で補う。
 ****************************************************/

// POST 本文を JSON として読む。読めなければ null を返す。
function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    Logger.log("parseRequestBody_: 本文がありません。");
    return null;
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    Logger.log("parseRequestBody_: JSON として読めません。");
    return null;
  }
}

// HF のペイロードを内部の形へ変換する。
function parseHuggingFacePayload_(payload) {
  if (!payload || !payload.repo) {
    Logger.log("parseHuggingFacePayload_: repo がありません。");
    return null;
  }

  const repo = payload.repo;
  const event = payload.event || {};
  const webUrl = repo.url ? toText_(repo.url.web) : "";

  return {
    repoName: toText_(repo.name),
    repoType: toText_(repo.type) || "model",
    isPrivate: repo.private === true,
    webUrl: webUrl,
    action: toText_(event.action),
    scope: toText_(event.scope),
    refs: normalizeUpdatedRefs_(payload.updatedRefs)
  };
}

// updatedRefs を扱いやすい配列へそろえる。
// 一度の push で複数の ref が動くことがあるため，配列のまま持つ。
function normalizeUpdatedRefs_(updatedRefs) {
  if (!updatedRefs || !Array.isArray(updatedRefs)) {
    return [];
  }

  return updatedRefs.map(function(item) {
    const ref = toText_(item.ref);
    const oldSha = toText_(item.oldSha);
    const newSha = toText_(item.newSha);
    const info = parseRef_(ref);

    return {
      ref: ref,
      name: info.name,
      kind: info.kind,
      oldSha: oldSha,
      newSha: newSha,
      // newSha が無いものは削除，oldSha が無いものは新規作成。
      isDeleted: newSha === "",
      isCreated: oldSha === "" && newSha !== ""
    };
  });
}

// 通知対象のイベントかどうかを設定に照らして判定する。
function shouldNotifyEvent_(parsed, settings) {
  if (!parsed || !parsed.repoName) {
    return false;
  }

  if (parsed.isPrivate && !settings.notifyPrivateRepos) {
    Logger.log("shouldNotifyEvent_: private のため対象外です。" + parsed.repoName);
    return false;
  }

  if (settings.targetRepoTypes.length > 0
      && settings.targetRepoTypes.indexOf(parsed.repoType) === -1) {
    Logger.log("shouldNotifyEvent_: 種別が対象外です。" + parsed.repoType);
    return false;
  }

  if (settings.targetRepos.length > 0
      && settings.targetRepos.indexOf(parsed.repoName) === -1) {
    Logger.log("shouldNotifyEvent_: リポジトリが対象外です。" + parsed.repoName);
    return false;
  }

  return true;
}

// 通知する ref だけを残す。
function selectNotifiableRefs_(parsed, settings) {
  return parsed.refs.filter(function(ref) {
    if (ref.kind === "pr" && !settings.notifyPullRequestRefs) {
      return false;
    }

    if (ref.isDeleted && !settings.notifyOnDelete) {
      return false;
    }

    return ref.ref !== "";
  });
}
