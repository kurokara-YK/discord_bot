/****************************************************
 * message_builders.gs
 * ==================================================
 * Discord へ送る本文を組み立てる
 *
 * 作者名などが取れなければ，その行を省いて通知は成立させる。
 ****************************************************/

// 1回の push 全体を1通のメッセージにまとめる。
// ref ごとに送信を分けないこと。
function buildHuggingFaceMessage_(parsed, refs, commitInfoMap, settings) {
  if (refs.length === 0) {
    return "";
  }

  // 同じコミットを指す ref が複数あると同じ行が並ぶため，2件目以降は見出しだけにする。
  const shownSha = {};

  const blocks = refs.map(function(ref) {
    const isDuplicate = ref.newSha !== "" && shownSha[ref.newSha] === true;
    shownSha[ref.newSha] = true;

    return buildRefBlock_(parsed, ref, commitInfoMap[ref.ref] || null, settings, isDuplicate);
  });

  return "## 🤗 Hugging Face\n" + blocks.join("\n");
}

// ref 1つ分の表示を作る。
// isDuplicate は，同じコミットを上の行ですでに出したことを表す。
function buildRefBlock_(parsed, ref, commitInfo, settings, isDuplicate) {
  const rows = ["**[" + parsed.repoName + ":" + buildRefLabel_(ref) + "]** " + buildRefSummary_(ref)];

  // 削除されたブランチには参照先のコミットがない。
  // 同じコミットの詳細を二度並べても意味がない。
  if (ref.isDeleted || isDuplicate) {
    return rows.join("\n");
  }

  rows.push(buildCommitLine_(ref, commitInfo, settings));

  // API から時刻が取れないときは受信時刻で代用する。
  rows.push("> " + formatDateTime_(commitInfo && commitInfo.date ? commitInfo.date : new Date()));

  if (parsed.webUrl && ref.newSha) {
    rows.push("[🔗 コミットを見る](" + parsed.webUrl + "/commit/" + ref.newSha + ")");
  }

  return rows.join("\n");
}

// 角かっこの中に出す ref の名前。種類が分かるようにする。
function buildRefLabel_(ref) {
  if (ref.kind === "tag") {
    return "tag " + ref.name;
  }

  if (ref.kind === "pr") {
    return "PR #" + ref.name;
  }

  return ref.name;
}

// ref の状態を短い言葉で表す。
function buildRefSummary_(ref) {
  const target = REF_KIND_LABELS[ref.kind] || "ブランチ";

  if (ref.isDeleted) {
    return target + "が削除されました";
  }

  if (ref.isCreated) {
    return "新しい" + target;
  }

  return "1 new commit";
}

// SHA・件名・作者を1行にまとめる。取れないものは省く。
function buildCommitLine_(ref, commitInfo, settings) {
  const parts = ["> `" + shortSha_(ref.newSha) + "`"];

  if (commitInfo && commitInfo.title) {
    parts.push(truncateText_(firstLineOf_(commitInfo.title), settings.commitMessageMaxLength));
  } else {
    // 件名が取れないと SHA だけの行になるため，何が起きたかを補う。
    parts.push("(コミットの詳細を取得できませんでした)");
  }

  if (settings.showAuthor && commitInfo && commitInfo.author) {
    parts.push("— **" + commitInfo.author + "**");
  }

  return parts.join(" ");
}

// 失敗を知らせる本文。秘密情報は入れないこと。
function buildErrorMessage_(message) {
  return "⚠️ **Hugging Face 通知BOT でエラーが発生しました**\n> " + truncateText_(message, 200);
}
