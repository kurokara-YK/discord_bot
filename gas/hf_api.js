/****************************************************
 * hf_api.gs
 * ==================================================
 * HF の commits API で作者名などを補う
 *
 * Webhook には push した人が入っていないため取りに行く。
 * 失敗しても通知は止めず，作者行を省くだけにする。
 ****************************************************/

// 指定した SHA のコミット情報を取る。取れなければ null を返す。
function fetchCommitInfo_(parsed, ref, settings) {
  if (!settings.fetchCommitDetails || ref.isDeleted) {
    return null;
  }

  // タグや PR は commits API の revision として扱わない。
  if (ref.kind !== "branch" || !ref.newSha) {
    return null;
  }

  const revision = ref.name;

  const url = "https://huggingface.co/api/"
    + repoTypeToApiSegment_(parsed.repoType) + "/"
    + parsed.repoName + "/commits/" + encodeURIComponent(revision) + "?limit=10";

  const commits = fetchCommitList_(url);

  if (!commits) {
    return null;
  }

  // 先頭決め打ちにせず，newSha と一致するコミットを探す。
  for (let i = 0; i < commits.length; i++) {
    if (String(commits[i].id) === ref.newSha) {
      return toCommitInfo_(commits[i]);
    }
  }

  Logger.log("fetchCommitInfo_: 一致するコミットが見つかりません。sha=" + shortSha_(ref.newSha));
  return null;
}

// commits API を呼ぶ。失敗しても例外を投げない。
function fetchCommitList_(url) {
  const options = {
    method: "get",
    muteHttpExceptions: true
  };

  const accessToken = getHuggingFaceAccessToken_();

  // private リポジトリを読むときだけ Authorization を付ける。
  if (accessToken) {
    options.headers = { Authorization: "Bearer " + accessToken };
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();

    if (statusCode < 200 || statusCode >= 300) {
      // URL にトークンは含まれないのでログに出してよい。
      Logger.log("fetchCommitList_: 取得できません。status=" + statusCode);
      return null;
    }

    const parsed = JSON.parse(response.getContentText());
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    Logger.log("fetchCommitList_: 呼び出しに失敗しました。" + error.message);
    return null;
  }
}

// API の応答を内部の形へそろえる。
function toCommitInfo_(commit) {
  const authors = Array.isArray(commit.authors) ? commit.authors : [];

  return {
    author: authors.length > 0 ? toText_(authors[0].user) : "",
    title: toText_(commit.title),
    date: isBlank_(commit.date) ? null : new Date(commit.date)
  };
}
