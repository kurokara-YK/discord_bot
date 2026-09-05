/****************************************************
 * messages.gs
 * ==================================================
 * Discord へ送る文面
 *
 * 【使いかた】
 * 下の MESSAGES に文面のまとまりを定義し，
 * config_roster.js の messageSet で，どれを使うか名前で指定する。
 *
 *   config_roster.js:  messageSet: "presentation",
 *
 * 【文面で使える変数】
 *   {assignees}  担当者のメンション（つなぎ文字で連結される）
 *   {content}    内容列の値
 *   {dutyDate}   担当日（例: 9月24日）
 *   {name}       名前（unknownMemberTemplate でのみ使う）
 *
 * 【自分用の文面を作るには】
 * template をコピーして別の名前で足し，
 * config_roster.js の messageSet をその名前に変えるだけでよい。
 * 既存の文面を書き換える必要はない。
 ****************************************************/

const MESSAGES = {

  // ================================================
  // template
  // ------------------------------------------------
  // 用途を問わない雛形。
  // これをコピーして自分の文面を作る出発点にする。
  // ================================================
  template: {

    // 担当者がいる回に送る文面。
    assigneeMessageTemplate:
      "次回の担当は{assignees}です。よろしくお願いします。",

    // 上の文面の末尾へ足す文面。内容列が空の回では足されない。
    contentSuffixTemplate:
      "\n内容: {content}",

    // 担当者がいない，内容だけが書かれた回に送る文面。
    eventMessageTemplate:
      "@everyone 次回は{content}があります。よろしくお願いします。",

    // 名簿に Discord ID が無い人の表示。メンションの代わりに使われる。
    unknownMemberTemplate: "{name}（ID未登録）",

    // 担当者が複数いるときの，メンションのつなぎ文字。
    assigneeSeparator: "、"
  },

  // ================================================
  // presentation
  // ------------------------------------------------
  // 研究室のミーティング発表当番。
  // 発表者へのリマインドと，要旨添削の期限を知らせる。
  // ================================================
  presentation: {

    assigneeMessageTemplate:
      "来週の発表は{assignees}です。よろしくお願いします。\n" +
      "要旨添削は月曜日の13時までに提出しましょう。",

    contentSuffixTemplate:
      "\n内容: {content}",

    eventMessageTemplate:
      "@everyone 来週は{content}があります。よろしくお願いします。\n" +
      "要旨添削が必要な場合は月曜日の13時までに提出しましょう。",

    unknownMemberTemplate: "{name}（ID未登録）",

    assigneeSeparator: "、"
  }
};

// messageSet で指定された文面を返す。
//
// 指定が見つからない場合は template を使い，実行ログへ警告を出す。
// 名前の書き間違いで通知が止まってしまうより，
// 雛形の文面で送られたほうが異常に気づきやすいため。
function getMessages_(messageSet) {
  const name = String(messageSet || "").trim();

  if (Object.prototype.hasOwnProperty.call(MESSAGES, name)) {
    return MESSAGES[name];
  }

  Logger.log(
    "警告: messageSet \"" + name + "\" は messages.js にありません。" +
    "template の文面を使います。" +
    "指定できるのは: " + Object.keys(MESSAGES).join(", ")
  );

  return MESSAGES.template;
}
