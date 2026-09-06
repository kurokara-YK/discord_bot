/****************************************************
 * schedule_builder.gs
 * ==================================================
 * 日程シートの読み取り
 *
 *   日付   予定        作業開始 作業終了 予定を送る お疲れさまを送る
 *   11/1   準備の日     7:00     20:00    6:30      20:00
 *   11/2   Day1 本番    9:00     18:00    (空)      (空)
 *
 * 作業時刻（何時から何時まで動くか）と通知時刻は別のもの。
 * 通知時刻が空なら作業時刻から決めるため，
 * 毎日おなじでよければ書かずに済む。
 *
 * ここに書いた日が，シフト表の日付プルダウンの候補になる。
 ****************************************************/

// 通知時刻が空のとき，作業開始の何分前に予定を送るか。
const SUMMARY_LEAD_MINUTES = 30;

// 日程シートを読む。日付が読めない行は飛ばす。
function getScheduleDays_(settings) {
  const sheet = openScheduleSheet_(settings);
  const lastRow = sheet.getLastRow();

  if (lastRow < ROW.DATA_START) {
    return [];
  }

  const rowCount = lastRow - ROW.DATA_START + 1;
  const values = sheet
    .getRange(ROW.DATA_START, 1, rowCount, SCHEDULE_COLUMN_COUNT)
    .getValues();

  const days = [];

  values.forEach(function(row, offset) {
    // 通知停止のスイッチが同じ列にあるため読み飛ばす。
    if (String(row[SCHEDULE_COL.DATE.index]).trim() === PAUSE_LABEL) {
      return;
    }

    const date = toDate_(row[SCHEDULE_COL.DATE.index], settings.fiscalYear);

    if (date === null) {
      return;
    }

    // 時と分を合わせて「0時からの分数」にする。
    const startMinutes = buildMinutesOfDay_(
      row[SCHEDULE_COL.START_HOUR.index], row[SCHEDULE_COL.START_MINUTE.index]
    );
    const endMinutes = buildMinutesOfDay_(
      row[SCHEDULE_COL.END_HOUR.index], row[SCHEDULE_COL.END_MINUTE.index]
    );

    // 通知時刻。空なら作業時刻から決める。
    const summaryMinutes = resolveNoticeMinutes_(
      buildMinutesOfDay_(
        row[SCHEDULE_COL.SUMMARY_HOUR.index], row[SCHEDULE_COL.SUMMARY_MINUTE.index]
      ),
      startMinutes === null ? null : Math.max(startMinutes - SUMMARY_LEAD_MINUTES, 0)
    );

    const closingMinutes = resolveNoticeMinutes_(
      buildMinutesOfDay_(
        row[SCHEDULE_COL.CLOSING_HOUR.index], row[SCHEDULE_COL.CLOSING_MINUTE.index]
      ),
      endMinutes
    );

    days.push({
      rowNumber: ROW.DATA_START + offset,
      date: date,
      dateKey: toDateKey_(date, settings.fiscalYear),
      label: toText_(row[SCHEDULE_COL.LABEL.index], ""),
      startMinutes: startMinutes,
      endMinutes: endMinutes,
      summaryMinutes: summaryMinutes,
      isSummarySent: toBoolean_(row[SCHEDULE_COL.SUMMARY_SENT.index]),
      closingMinutes: closingMinutes,
      isClosingSent: toBoolean_(row[SCHEDULE_COL.CLOSING_SENT.index]),
      memo: toText_(row[SCHEDULE_COL.MEMO.index], "")
    });
  });

  return days;
}

// 通知時刻を決める。書いてあればそれを使い，空なら作業時刻から補う。
function resolveNoticeMinutes_(written, fallback) {
  return written === null ? fallback : written;
}

// 送信済みのチェックを入れる。
function markScheduleAsSent_(settings, rowNumber, columnIndex) {
  openScheduleSheet_(settings).getRange(rowNumber, columnIndex + 1).setValue(true);
}

// 日付キーから，その日の情報を引ける表を作る。
function getDayInfoMap_(settings) {
  const map = {};

  getScheduleDays_(settings).forEach(function(day) {
    if (day.dateKey !== null) {
      map[day.dateKey] = day;
    }
  });

  return map;
}

// その日の情報を，通知文へ添える文字列にする。
// 例: " 準備の日 7:00〜20:00"。見出しへそのまま足せるよう前に空白を入れる。
function buildDayLabel_(dayInfo) {
  if (!dayInfo) {
    return "";
  }

  const parts = [];

  if (dayInfo.label !== "") {
    parts.push(dayInfo.label);
  }

  if (dayInfo.startMinutes !== null && dayInfo.endMinutes !== null) {
    parts.push(formatMinutesOfDay_(dayInfo.startMinutes) +
      TIME_RANGE_SEPARATOR + formatMinutesOfDay_(dayInfo.endMinutes));
  }

  return parts.length === 0 ? "" : " " + parts.join(" ");
}
