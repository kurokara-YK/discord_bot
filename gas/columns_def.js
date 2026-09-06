/****************************************************
 * columns_def.gs
 * ==================================================
 * 各シートの構造定義
 *
 * 列番号を他のファイルへ直接書かないための定義。
 * 列位置は必ず resolve*Columns_() から取ること。
 *
 * 【シフト表シート】見出しは2段（1段目=大見出し，2段目=時/分）
 *   A: No.  B: 日付  C,D: 開始 時/分  E,F: 終了 時/分
 *   G〜: 1人目〜8人目（数は設定で変わる）
 *   その右: メモ / 通知しない / 通知済み
 *
 *   1行 = 1つのコマ枠。日ごとにシートを分けない。
 *   分けると日数だけシートが増え，通知も集計もその数だけ書くことになる。
 *
 *   「日」の列は持たない。日付から作れるうえ判定に使わないため。
 *   時刻を時と分に分けているのは，1時間15分のような
 *   長さの違うコマを作れるようにするため。
 ****************************************************/

// 日付の書式と比較に使うタイムゾーン。appsscript.json と合わせること。
const TIME_ZONE = "Asia/Tokyo";

// ---------------------------------------------------
// シフト表シート
// ---------------------------------------------------

// 見出しは2段。1行目が大きな見出し，2行目が「時」「分」。
const ROW = {
  HEADER: 1,
  SUB_HEADER: 2,
  DATA_START: 3
};

// 担当者列より左の固定列。
const COL = {
  NO: { col: "A", header: "No." },
  DATE: { col: "B", header: "日付" },
  START_HOUR: { col: "C", header: "開始時刻" },
  START_MINUTE: { col: "D", header: "" },
  END_HOUR: { col: "E", header: "終了時刻" },
  END_MINUTE: { col: "F", header: "" },
  ASSIGNEE_START: { col: "G", header: "1人目" }
};

// 時・分の小見出し。
const HOUR_SUB_HEADER = "時";
const MINUTE_SUB_HEADER = "分";

// 担当者列の右に置く列。
const MEMO_HEADER = "メモ";
const SKIP_HEADER = "通知しない";
const SENT_HEADER = "通知済み";

// 時間帯の区切り。「10:00〜11:00」の「〜」。
const TIME_RANGE_SEPARATOR = "〜";

// 担当者の人数から，実際の列位置を組み立てる。
// index は 0始まり，number は 1始まり（getRange 用）。
function resolveColumns_(assigneeColumnCount) {
  const count = toIntegerAtLeast_(assigneeColumnCount, 8, 1);

  const assigneeFrom = colIndex_(COL.ASSIGNEE_START.col);
  const memoIndex = assigneeFrom + count;
  const skipIndex = memoIndex + 1;
  const sentIndex = skipIndex + 1;

  return {
    assigneeCount: count,

    noIndex: colIndex_(COL.NO.col),
    dateIndex: colIndex_(COL.DATE.col),
    startHourIndex: colIndex_(COL.START_HOUR.col),
    startMinuteIndex: colIndex_(COL.START_MINUTE.col),
    endHourIndex: colIndex_(COL.END_HOUR.col),
    endMinuteIndex: colIndex_(COL.END_MINUTE.col),
    assigneeFromIndex: assigneeFrom,
    memoIndex: memoIndex,
    skipIndex: skipIndex,
    sentIndex: sentIndex,

    startHourNumber: colIndex_(COL.START_HOUR.col) + 1,
    assigneeFromNumber: assigneeFrom + 1,
    memoNumber: memoIndex + 1,
    skipNumber: skipIndex + 1,
    sentNumber: sentIndex + 1,

    totalColumnCount: sentIndex + 1
  };
}

// 事前通知のタイミングをそろえる。
// 読めない値と0以下は捨て，重複を除いて大きい順（早い通知が先）に並べる。
function normalizeBeforeMinutes_(beforeMinutes) {
  const source = Array.isArray(beforeMinutes) ? beforeMinutes : [];
  const cleaned = [];

  source.forEach(function(value) {
    const minutes = parseInt(String(value), 10);

    if (!isNaN(minutes) && minutes > 0 && cleaned.indexOf(minutes) < 0) {
      cleaned.push(minutes);
    }
  });

  // 1つも読めなければ既定にする。通知が丸ごと止まるより気づきやすい。
  if (cleaned.length === 0) {
    return [60, 15];
  }

  return cleaned.sort(function(a, b) { return b - a; });
}

// シフト表の1段目の見出し。時刻は2列を結合するため，2列目は空にする。
function buildHeaderRow_(assigneeColumnCount) {
  const columns = resolveColumns_(assigneeColumnCount);

  const headers = [
    COL.NO.header,
    COL.DATE.header,
    COL.START_HOUR.header,
    COL.START_MINUTE.header,
    COL.END_HOUR.header,
    COL.END_MINUTE.header
  ];

  for (let i = 1; i <= columns.assigneeCount; i += 1) {
    headers.push(i + "人目");
  }

  return headers.concat([MEMO_HEADER, SKIP_HEADER, SENT_HEADER]);
}

// シフト表の2段目の見出し。「時」「分」だけを置く。
function buildSubHeaderRow_(assigneeColumnCount) {
  const columns = resolveColumns_(assigneeColumnCount);
  const headers = [];

  for (let i = 0; i < columns.totalColumnCount; i += 1) {
    headers.push("");
  }

  headers[columns.startHourIndex] = HOUR_SUB_HEADER;
  headers[columns.startMinuteIndex] = MINUTE_SUB_HEADER;
  headers[columns.endHourIndex] = HOUR_SUB_HEADER;
  headers[columns.endMinuteIndex] = MINUTE_SUB_HEADER;

  return headers;
}

// ---------------------------------------------------
// 名簿シート
// ---------------------------------------------------

const MEMBER_ROW = {
  HEADER: 1,
  DATA_START: 2
};

const MEMBER_COL = {
  NAME: { col: "A", header: "名前" },
  DISCORD_ID: { col: "B", header: "Discord ID" },
  SHIFT_COUNT: { col: "C", header: "担当コマ数(自動)" },
  MEMO: { col: "D", header: "メモ" }
};

function buildMemberHeaderRow_() {
  return [
    MEMBER_COL.NAME.header,
    MEMBER_COL.DISCORD_ID.header,
    MEMBER_COL.SHIFT_COUNT.header,
    MEMBER_COL.MEMO.header
  ];
}

// ---------------------------------------------------
// 日程シート
// ---------------------------------------------------
//
// その日が何の日か，作業の時間帯，通知を送る時刻を書く表。
//
// 作業時刻（何時から何時まで動くか）と通知時刻は別のもの。
// 準備日は7時開始だから予定は6時半に，本番日は9時開始だから8時に，
// と日によって変わるため，日ごとに書けるようにしている。
// 通知時刻が空なら作業時刻から決める（schedule_builder.js）。
//
// シフト表の日付プルダウンは，ここに書いた日から選ぶ。
//
// 行の構成はシフト表と同じ（ROW を使う）。表の最下行に通知の停止を置く。

// 日程シートの列。見出しは2段で，時刻は時と分の2列にまたがる。
const SCHEDULE_COL = {
  DATE: { index: 0, header: "日付" },
  LABEL: { index: 1, header: "その日の予定" },
  START_HOUR: { index: 2, header: "作業開始" },
  START_MINUTE: { index: 3, header: "" },
  END_HOUR: { index: 4, header: "作業終了" },
  END_MINUTE: { index: 5, header: "" },
  SUMMARY_HOUR: { index: 6, header: "予定を送る" },
  SUMMARY_MINUTE: { index: 7, header: "" },
  SUMMARY_SENT: { index: 8, header: "送信済" },
  CLOSING_HOUR: { index: 9, header: "お疲れさまを送る" },
  CLOSING_MINUTE: { index: 10, header: "" },
  CLOSING_SENT: { index: 11, header: "送信済" },
  MEMO: { index: 12, header: "メモ" }
};

const SCHEDULE_COLUMN_COUNT = 13;

// 時と分にまたがる列の，1段目の先頭 index。
const SCHEDULE_TIME_PAIRS = [
  SCHEDULE_COL.START_HOUR.index,
  SCHEDULE_COL.END_HOUR.index,
  SCHEDULE_COL.SUMMARY_HOUR.index,
  SCHEDULE_COL.CLOSING_HOUR.index
];

const PAUSE_LABEL = "通知を停止";

function buildScheduleHeaderRow_() {
  return [
    SCHEDULE_COL.DATE.header,
    SCHEDULE_COL.LABEL.header,
    SCHEDULE_COL.START_HOUR.header,
    SCHEDULE_COL.START_MINUTE.header,
    SCHEDULE_COL.END_HOUR.header,
    SCHEDULE_COL.END_MINUTE.header,
    SCHEDULE_COL.SUMMARY_HOUR.header,
    SCHEDULE_COL.SUMMARY_MINUTE.header,
    SCHEDULE_COL.SUMMARY_SENT.header,
    SCHEDULE_COL.CLOSING_HOUR.header,
    SCHEDULE_COL.CLOSING_MINUTE.header,
    SCHEDULE_COL.CLOSING_SENT.header,
    SCHEDULE_COL.MEMO.header
  ];
}

// 日程シートの2段目の見出し。「時」「分」だけを置く。
function buildScheduleSubHeaderRow_() {
  const headers = [];

  for (let i = 0; i < SCHEDULE_COLUMN_COUNT; i += 1) {
    headers.push("");
  }

  SCHEDULE_TIME_PAIRS.forEach(function(index) {
    headers[index] = HOUR_SUB_HEADER;
    headers[index + 1] = MINUTE_SUB_HEADER;
  });

  return headers;
}
