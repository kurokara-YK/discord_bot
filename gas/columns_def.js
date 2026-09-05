/****************************************************
 * columns_def.gs
 * ==================================================
 * 当番表と名簿シートの構造定義
 *
 * 列番号を他のファイルへ直接書かないための定義。
 * 列位置は必ず resolveColumns_() から取ること。
 *
 * 【当番表シートの構造】
 *   1行目     : 見出し行
 *   2行目以降 : データ行
 *
 *   A列    : No.
 *   B列    : 担当日
 *   C列    : 通知日
 *   D〜K列 : 1人目〜8人目（担当者列。数は設定で変わる）
 *   L列    : 内容      … 発表回名やイベント名。通知文に載る
 *   M列    : メモ      … 人が自由に書く欄。通知には使わない
 *   N列    : 通知済み  … 送信するとチェックが入る
 *
 * 担当者の人数を変えると，右側の列の位置も後ろへずれる。
 ****************************************************/

// 日付の書式と比較に使うタイムゾーン。appsscript.json と合わせること。
const TIME_ZONE = "Asia/Tokyo";

// 行定義。
const ROW = {
  HEADER: 1,
  DATA_START: 2
};

// 担当者列より左の固定列。
const COL = {
  NO: { col: "A", header: "No." },
  DUTY_DATE: { col: "B", header: "担当日" },
  NOTICE_DATE: { col: "C", header: "通知日" },
  ASSIGNEE_START: { col: "D", header: "1人目" }
};

// 担当者列の右に置く列。
const CONTENT_HEADER = "内容";
const MEMO_HEADER = "メモ";
const SENT_HEADER = "通知済み";

// 名簿シート。
const MEMBER_ROW = {
  HEADER: 1,
  DATA_START: 2
};

const MEMBER_COL = {
  NAME: { col: "A", header: "名前" },
  DISCORD_ID: { col: "B", header: "Discord ID" },
  MEMO: { col: "C", header: "メモ" }
};

// 担当者の人数から，実際の列位置を組み立てる。
// index は 0始まり，number は 1始まり（getRange 用）。
function resolveColumns_(assigneeColumnCount) {
  const count = toIntegerAtLeast_(assigneeColumnCount, 8, 1);
  const assigneeFrom = colIndex_(COL.ASSIGNEE_START.col);
  const contentIndex = assigneeFrom + count;
  const memoIndex = contentIndex + 1;
  const sentIndex = memoIndex + 1;

  return {
    assigneeCount: count,

    noIndex: colIndex_(COL.NO.col),
    dutyDateIndex: colIndex_(COL.DUTY_DATE.col),
    noticeDateIndex: colIndex_(COL.NOTICE_DATE.col),
    assigneeFromIndex: assigneeFrom,
    contentIndex: contentIndex,
    memoIndex: memoIndex,
    sentIndex: sentIndex,

    assigneeFromNumber: assigneeFrom + 1,
    contentNumber: contentIndex + 1,
    memoNumber: memoIndex + 1,
    sentNumber: sentIndex + 1,

    totalColumnCount: sentIndex + 1
  };
}

// 当番表の見出し行を組み立てる。
function buildHeaderRow_(assigneeColumnCount) {
  const headers = [COL.NO.header, COL.DUTY_DATE.header, COL.NOTICE_DATE.header];

  for (let i = 1; i <= assigneeColumnCount; i += 1) {
    headers.push(i + "人目");
  }

  return headers.concat([CONTENT_HEADER, MEMO_HEADER, SENT_HEADER]);
}

// 名簿シートの見出し行。
function buildMemberHeaderRow_() {
  return [MEMBER_COL.NAME.header, MEMBER_COL.DISCORD_ID.header, MEMBER_COL.MEMO.header];
}
