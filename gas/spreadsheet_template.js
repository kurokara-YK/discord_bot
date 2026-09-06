/****************************************************
 * spreadsheet_template.gs
 * ==================================================
 * シフト表スプレッドシートの新規作成と入力補助
 *
 * 【注意】
 * createSpreadsheet_ は，最初の1回だけ使うもの。
 * 運用中のシートへ実行すると，入力済みの内容が消える。
 ****************************************************/

// 列幅。
const WIDTH = {
  no: 50, date: 110, time: 55,
  assignee: 100, memo: 200, check: 90
};

// 名簿シートの列幅。
const MEMBER_WIDTHS = [140, 200, 130, 200];

// 設定シートの列幅。
const SCHEDULE_WIDTHS = [100, 130, 45, 45, 45, 45, 45, 45, 70, 45, 45, 70, 150];

// プルダウンと集計が参照する名簿の行数。多めにとる。
const MEMBER_RANGE_ROWS = 200;

// 日程シートに用意する行数。
const SCHEDULE_ROW_COUNT = 10;

// シフト表に最初から用意する行数。足りなければシート上で行を足す。
const SHIFT_ROW_COUNT = 30;

// 「時」「分」のプルダウン候補を作る。
// 候補は "00" のように0埋めする。数値だと 9 と 09 が混ざる。
function buildPaddedNumberChoices_(from, to, step) {
  const interval = toIntegerAtLeast_(step, 1, 1);
  const choices = [];

  for (let value = from; value <= to; value += interval) {
    choices.push(padNumber_(value));
  }

  return choices;
}

// ダブルクリックでカレンダーが開く入力規則。
function buildDateRule_() {
  return SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(true)
    .setHelpText("セルをダブルクリックすると，カレンダーから日付を選べます。")
    .build();
}

// 一覧から選ぶ入力規則。候補に無い値も入れられる。
// choices には配列のほか，参照する範囲も渡せる。
function buildChoiceRule_(choices, helpText) {
  const builder = SpreadsheetApp.newDataValidation();

  if (Array.isArray(choices)) {
    builder.requireValueInList(choices, true);
  } else {
    builder.requireValueInRange(choices, true);
  }

  return builder.setAllowInvalid(true).setHelpText(helpText).build();
}

// 時と分が並んだ2列にプルダウンを入れる。
// firstColumns は「時」の列番号（1始まり）の配列。
function applyTimeValidations_(sheet, fromRow, rowCount, firstColumns, minuteStep) {
  const hourRule = buildChoiceRule_(
    buildPaddedNumberChoices_(0, 23, 1), "0〜23 の時を選んでください。"
  );
  const minuteRule = buildChoiceRule_(
    buildPaddedNumberChoices_(0, 59, minuteStep), minuteStep + "分刻みで選んでください。"
  );

  firstColumns.forEach(function(column) {
    // 数値として読むと 09 が 9 になり，0埋めが崩れる。
    sheet.getRange(fromRow, column, rowCount, 2).setNumberFormat("@");
    sheet.getRange(fromRow, column, rowCount, 1).setDataValidation(hourRule);
    sheet.getRange(fromRow, column + 1, rowCount, 1).setDataValidation(minuteRule);
  });
}

// 並んだ列にチェックボックスを入れる。
function applyCheckboxes_(sheet, fromRow, rowCount, columns) {
  const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();

  columns.forEach(function(column) {
    sheet.getRange(fromRow, column, rowCount, 1).setDataValidation(rule).setValue(false);
  });
}

// 2段の見出しを作る。
// pairFirsts の列は1段目を横に結合し，ほかは2段を縦に結合する。
function applyTwoRowHeader_(sheet, headers, subHeaders, pairFirsts) {
  const count = headers.length;

  sheet.getRange(ROW.HEADER, 1, 1, count).setValues([headers]);
  sheet.getRange(ROW.SUB_HEADER, 1, 1, count).setValues([subHeaders]);

  const paired = [];

  pairFirsts.forEach(function(index) {
    sheet.getRange(ROW.HEADER, index + 1, 1, 2).merge();
    paired.push(index, index + 1);
  });

  for (let i = 0; i < count; i += 1) {
    if (paired.indexOf(i) < 0) {
      sheet.getRange(ROW.HEADER, i + 1, 2, 1).merge();
    }
  }

  sheet.getRange(ROW.HEADER, 1, 2, count).setFontWeight("bold").setBackground(HEADER_COLOR);
  sheet.setFrozenRows(ROW.SUB_HEADER);
  sheet.setRowHeight(ROW.HEADER, 26);
  sheet.setRowHeight(ROW.SUB_HEADER, 22);
}

// 見出しの背景色。薄い緑。
const HEADER_COLOR = "#d9ead3";

// 日程シートに最初から入れておく例。
// 通知時刻を空にすると作業時刻から決まるため，1日目だけ書いてある。
const SAMPLE_SCHEDULE = [
  ["11/1", "準備の日", "07", "00", "20", "00", "06", "30", "20", "00", ""],
  ["11/2", "Day1 本番", "09", "00", "18", "00", "", "", "", "", ""],
  ["11/3", "Day2 本番", "09", "00", "18", "00", "", "", "", "", ""],
  ["11/4", "片付けの日", "09", "00", "15", "00", "", "", "", "", ""]
];

// SAMPLE_SCHEDULE が埋める列。送信済みのチェックボックスは飛ばす。
const SAMPLE_SCHEDULE_COLUMNS = [
  SCHEDULE_COL.DATE.index,
  SCHEDULE_COL.LABEL.index,
  SCHEDULE_COL.START_HOUR.index,
  SCHEDULE_COL.START_MINUTE.index,
  SCHEDULE_COL.END_HOUR.index,
  SCHEDULE_COL.END_MINUTE.index,
  SCHEDULE_COL.SUMMARY_HOUR.index,
  SCHEDULE_COL.SUMMARY_MINUTE.index,
  SCHEDULE_COL.CLOSING_HOUR.index,
  SCHEDULE_COL.CLOSING_MINUTE.index,
  SCHEDULE_COL.MEMO.index
];

// ---------------------------------------------------
// 新規作成
// ---------------------------------------------------

// 4つのシートを持つスプレッドシートを新規作成する。
function createSpreadsheet_(settings) {
  const folder = resolveFolder_(settings);
  const spreadsheet = SpreadsheetApp.create(settings.fileName);

  const scheduleSheet = spreadsheet.getSheets()[0];
  scheduleSheet.setName(settings.scheduleSheetName);
  setupScheduleSheet_(scheduleSheet, settings);

  // 名簿を先に作る。シフト表の担当者プルダウンが名簿を参照するため。
  const memberSheet = spreadsheet.insertSheet(settings.memberSheetName);
  setupMemberSheet_(memberSheet, settings);

  const shiftSheet = spreadsheet.insertSheet(settings.shiftSheetName);
  setupShiftSheet_(shiftSheet, memberSheet, scheduleSheet, settings);

  // 数式はシフト表ができてから入れる。先に入れると #REF! で固定される。
  applyShiftCountFormula_(memberSheet, settings);

  // ふだん開くのはシフト表のため，名簿より左に置く。
  spreadsheet.setActiveSheet(shiftSheet);
  spreadsheet.moveActiveSheet(2);
  spreadsheet.setActiveSheet(shiftSheet);

  if (folder !== null) {
    DriveApp.getFileById(spreadsheet.getId()).moveTo(folder);
  }

  return {
    id: spreadsheet.getId(),
    url: spreadsheet.getUrl(),
    name: spreadsheet.getName(),
    folderName: folder === null ? "マイドライブ（フォルダ未指定）" : folder.getName()
  };
}

// 作成先フォルダを解決する。未指定ならマイドライブ直下。
function resolveFolder_(settings) {
  const folderId = settings.templateFolderId;

  if (!folderId) {
    return null;
  }

  if (isPlaceholder_(folderId)) {
    throw new Error(
      "templateFolderId が未設定です。config_shift.js に作成先フォルダのURLを設定するか，" +
      "マイドライブ直下でよければ空文字にしてください。"
    );
  }

  try {
    return DriveApp.getFolderById(folderId);
  } catch (error) {
    throw new Error(
      "フォルダを開けませんでした。folderId=" + folderId +
      " / URLが正しいか，アクセス権があるか確認してください。"
    );
  }
}

// ---------------------------------------------------
// 日程シート
// ---------------------------------------------------

// 日程シートを作る。
// その日が何の日か，作業の時間帯，通知を送る時刻を書く表。
function setupScheduleSheet_(sheet, settings) {
  const lastDataRow = ROW.DATA_START + SCHEDULE_ROW_COUNT - 1;
  const pauseRow = lastDataRow + 2;

  sheet.clear();
  trimColumns_(sheet, SCHEDULE_COLUMN_COUNT);
  trimRows_(sheet, pauseRow);

  applyTwoRowHeader_(
    sheet, buildScheduleHeaderRow_(), buildScheduleSubHeaderRow_(), SCHEDULE_TIME_PAIRS
  );

  sheet.getRange(1, 1, lastDataRow, SCHEDULE_COLUMN_COUNT)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, true, true);

  setupScheduleValidations_(sheet, settings);
  fillSampleSchedule_(sheet);
  setupPauseSwitch_(sheet, pauseRow);

  SCHEDULE_WIDTHS.forEach(function(width, index) {
    sheet.setColumnWidth(index + 1, width);
  });
}

// 日程シートの入力規則を入れる。
function setupScheduleValidations_(sheet, settings) {
  const rows = SCHEDULE_ROW_COUNT;

  sheet.getRange(ROW.DATA_START, SCHEDULE_COL.DATE.index + 1, rows, 1)
    .setNumberFormat("yyyy/MM/dd")
    .setDataValidation(buildDateRule_());

  applyTimeValidations_(
    sheet, ROW.DATA_START, rows,
    SCHEDULE_TIME_PAIRS.map(function(index) { return index + 1; }),
    settings.minuteStep
  );

  applyCheckboxes_(sheet, ROW.DATA_START, rows, [
    SCHEDULE_COL.SUMMARY_SENT.index + 1, SCHEDULE_COL.CLOSING_SENT.index + 1
  ]);
}

// 日程の例を入れる。送信済みのチェックボックス列は飛ばす。
function fillSampleSchedule_(sheet) {
  SAMPLE_SCHEDULE_COLUMNS.forEach(function(columnIndex, offset) {
    const values = SAMPLE_SCHEDULE.map(function(row) { return [row[offset]]; });

    sheet.getRange(ROW.DATA_START, columnIndex + 1, values.length, 1).setValues(values);
  });
}

// 通知を止めるスイッチを，表の下に置く。
// 当日その場で切り替えられるよう，config ではなくシート側に置いている。
function setupPauseSwitch_(sheet, row) {
  sheet.getRange(row, 1).setValue(PAUSE_LABEL).setFontWeight("bold")
    .setHorizontalAlignment("center");

  sheet.getRange(row, 2)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build())
    .setValue(false)
    .setHorizontalAlignment("center");

  sheet.getRange(row, 3, 1, SCHEDULE_COLUMN_COUNT - 2)
    .merge()
    .setValue("← 入れるとすべての通知を止めます")
    .setFontColor("#666666");
}

// ---------------------------------------------------
// シフト表シート
// ---------------------------------------------------

// シフト表シートの見出しと書式を作る。
//
// 行は最初から SHIFT_ROW_COUNT 行ぶん用意し，プルダウンを入れておく。
// 人が手で埋められるようにするため。
// 設定シートの日程から一括で作りたい場合は build_shift_table を使う。
//
// 名簿シートは引数で受け取る。担当者のプルダウンが名簿の範囲を
// 参照するため。新規作成のときは config の spreadsheetId がまだ
// 空のため，config 経由では開けない。
function setupShiftSheet_(sheet, memberSheet, scheduleSheet, settings) {
  const columns = resolveColumns_(settings.assigneeColumnCount);
  const dataRows = SHIFT_ROW_COUNT;
  const lastRow = ROW.DATA_START + dataRows - 1;

  sheet.clear();
  sheet.clearConditionalFormatRules();
  trimColumns_(sheet, columns.totalColumnCount);
  trimRows_(sheet, lastRow);

  applyTwoRowHeader_(
    sheet,
    buildHeaderRow_(settings.assigneeColumnCount),
    buildSubHeaderRow_(settings.assigneeColumnCount),
    [columns.startHourIndex, columns.endHourIndex]
  );

  sheet.getRange(1, 1, lastRow, columns.totalColumnCount)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBorder(true, true, true, true, true, true);

  // 時刻まで固定する。右へスクロールしても，どの枠か分かるようにするため。
  sheet.setFrozenColumns(colIndex_(COL.END_MINUTE.col) + 1);

  // No. 列に 1..n を入れておく。書き換えてよい。
  const numbers = [];

  for (let i = 1; i <= dataRows; i += 1) {
    numbers.push([i]);
  }

  sheet.getRange(ROW.DATA_START, columns.noIndex + 1, dataRows, 1).setValues(numbers);

  setupShiftValidations_(sheet, memberSheet, scheduleSheet, settings, columns, dataRows);
  setupShiftWidths_(sheet, columns);
  applyShiftFormatRules_(sheet, columns, lastRow);
}

// シフト表の入力規則を入れる。
// 手で打つと表記がゆれ，同じコマが別のものとして扱われてしまう。
function setupShiftValidations_(sheet, memberSheet, scheduleSheet, settings, columns, dataRows) {
  // 日付は日程シートの範囲を参照する。行を足すと候補も増える。
  const dateRange = scheduleSheet.getRange(
    ROW.DATA_START, SCHEDULE_COL.DATE.index + 1, SCHEDULE_ROW_COUNT, 1
  );

  // 書式は日程シートと同じ日付にする。
  // 文字列書式にすると，選んだ値が日付として読めなくなる。
  sheet.getRange(ROW.DATA_START, columns.dateIndex + 1, dataRows, 1)
    .setNumberFormat("yyyy/MM/dd")
    .setDataValidation(
      buildChoiceRule_(dateRange, "日程シートに書いた日から選んでください。")
    );

  applyTimeValidations_(
    sheet, ROW.DATA_START, dataRows,
    [columns.startHourIndex + 1, columns.endHourIndex + 1], settings.minuteStep
  );

  applyAssigneeDropdown_(sheet, memberSheet, columns, dataRows);
  applyCheckboxes_(sheet, ROW.DATA_START, dataRows, [columns.skipNumber, columns.sentNumber]);
}

// シフト表の列幅を整える。
function setupShiftWidths_(sheet, columns) {
  sheet.setColumnWidth(columns.noIndex + 1, WIDTH.no);
  sheet.setColumnWidth(columns.dateIndex + 1, WIDTH.date);

  [columns.startHourIndex, columns.startMinuteIndex,
   columns.endHourIndex, columns.endMinuteIndex].forEach(function(index) {
    sheet.setColumnWidth(index + 1, WIDTH.time);
  });

  for (let i = 0; i < columns.assigneeCount; i += 1) {
    sheet.setColumnWidth(columns.assigneeFromNumber + i, WIDTH.assignee);
  }

  sheet.setColumnWidth(columns.memoNumber, WIDTH.memo);
  sheet.setColumnWidth(columns.skipNumber, WIDTH.check);
  sheet.setColumnWidth(columns.sentNumber, WIDTH.check);
}

// 通知しない枠を灰色にして，止めていることを見落とさないようにする。
function applyShiftFormatRules_(sheet, columns, lastRow) {
  if (lastRow < ROW.DATA_START) {
    return;
  }

  const dataRows = lastRow - ROW.DATA_START + 1;
  const skipLetter = columnLetter_(columns.skipNumber);

  const skipRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=$" + skipLetter + ROW.DATA_START + "=TRUE")
    .setBackground("#efefef")
    .setFontColor("#999999")
    .setRanges([sheet.getRange(ROW.DATA_START, 1, dataRows, columns.totalColumnCount)])
    .build();

  sheet.setConditionalFormatRules([skipRule]);
}

// 列番号を列記号へ。例: 1 -> A, 27 -> AA
function columnLetter_(columnNumber) {
  let number = columnNumber;
  let letter = "";

  while (number > 0) {
    const remainder = (number - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    number = Math.floor((number - 1) / 26);
  }

  return letter;
}

// 担当者列にプルダウンを設定する。
// 範囲参照にしておくと，名簿へ行を足すだけで候補が増える。
function applyAssigneeDropdown_(sheet, memberSheet, columns, rowCount) {
  const memberRange = memberSheet.getRange(
    MEMBER_ROW.DATA_START, colIndex_(MEMBER_COL.NAME.col) + 1, MEMBER_RANGE_ROWS, 1
  );

  // 名簿に無い名前は入力させない。打ち間違いでメンションが飛ばなくなるため。
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(memberRange, true)
    .setAllowInvalid(false)
    .setHelpText("名簿シートの名前から選んでください。空欄のままでも構いません。")
    .build();

  sheet
    .getRange(ROW.DATA_START, columns.assigneeFromNumber, rowCount, columns.assigneeCount)
    .setDataValidation(rule);
}

// ---------------------------------------------------
// 名簿シート
// ---------------------------------------------------

// 名簿シートを作る。Discord ID は数値扱いすると桁が落ちるため文字列書式にする。
function setupMemberSheet_(sheet, settings) {
  const headers = buildMemberHeaderRow_();
  const rowCount = MEMBER_RANGE_ROWS;

  sheet.clear();
  trimColumns_(sheet, headers.length);
  trimRows_(sheet, rowCount);

  sheet.getRange(1, colIndex_(MEMBER_COL.DISCORD_ID.col) + 1, rowCount, 1)
    .setNumberFormat("@");

  sheet.getRange(MEMBER_ROW.HEADER, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(1, 1, rowCount, headers.length)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, true, true);

  sheet.getRange(MEMBER_ROW.HEADER, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground(HEADER_COLOR);

  sheet.setFrozenRows(MEMBER_ROW.HEADER);
  sheet.setRowHeight(MEMBER_ROW.HEADER, 32);

  MEMBER_WIDTHS.forEach(function(width, index) {
    sheet.setColumnWidth(index + 1, width);
  });
}

// 担当コマ数の集計式を入れる。
//
// 担当コマ数の集計式を入れる。偏りを見るのに使う。
//
// シフト表ができてから呼ぶこと。参照先が無い状態で入れると
// #REF! で固定され，あとからシートを作っても戻らない。
function applyShiftCountFormula_(sheet, settings) {
  const columns = resolveColumns_(settings.assigneeColumnCount);
  const dataRows = MEMBER_RANGE_ROWS - MEMBER_ROW.DATA_START + 1;

  const sheetName = "'" + settings.shiftSheetName + "'";
  const fromLetter = columnLetter_(columns.assigneeFromNumber);
  const toLetter = columnLetter_(columns.assigneeFromNumber + columns.assigneeCount - 1);
  const nameLetter = MEMBER_COL.NAME.col;

  const formulas = [];

  for (let i = 0; i < dataRows; i += 1) {
    const row = MEMBER_ROW.DATA_START + i;

    // 名前が空の行は空欄にする。0 が並ぶと読みにくいため。
    formulas.push([
      "=IF($" + nameLetter + row + "=\"\",\"\"," +
      "COUNTIF(" + sheetName + "!$" + fromLetter + ":$" + toLetter + ",$" + nameLetter + row + "))"
    ]);
  }

  sheet
    .getRange(MEMBER_ROW.DATA_START, colIndex_(MEMBER_COL.SHIFT_COUNT.col) + 1, dataRows, 1)
    .setFormulas(formulas);
}

// ---------------------------------------------------
// 共通
// ---------------------------------------------------

// 使わない列を削除する。既定の26列のままだと空列が残るため。
function trimColumns_(sheet, columnCount) {
  const extra = sheet.getMaxColumns() - columnCount;

  if (extra > 0) {
    sheet.deleteColumns(columnCount + 1, extra);
  }
}

// 使わない行を削除する。1000行のままだと表の終わりが分かりにくいため。
function trimRows_(sheet, rowCount) {
  const extra = sheet.getMaxRows() - rowCount;

  if (extra > 0) {
    sheet.deleteRows(rowCount + 1, extra);
  }
}
