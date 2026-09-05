/****************************************************
 * spreadsheet_template.gs
 * ==================================================
 * 当番表スプレッドシートの新規作成と入力補助
 *
 * 【注意】
 * 作成関数は，最初の1回だけ使うもの。
 * 運用中のシートへ実行すると，入力済みの内容が消える。
 * 既存のシートへプルダウンを足したい場合は
 * applyDropdowns_ を単体で呼ぶこと。
 ****************************************************/

// 列幅。
const WIDTH = { no: 50, date: 110, assignee: 100, content: 200, memo: 220, sent: 90 };

// 名簿シートの列幅。
const MEMBER_WIDTHS = [140, 200, 240];

// プルダウンが参照する名簿の行数。実際の人数より多めにとる。
const MEMBER_RANGE_ROWS = 200;

// 内容列のプルダウン候補。
// 何を書くかは用途によって変わるため，こちらでは決め打ちしない。
// 使ううちに定型が決まってきたら，ここへ書き足していく。
const CONTENT_CHOICES = [
  "テスト"
];

// 当番表と名簿シートを持つスプレッドシートを新規作成する。
function createSpreadsheet_(settings) {
  const folder = resolveFolder_(settings);
  const spreadsheet = SpreadsheetApp.create(settings.fileName);

  const rosterSheet = spreadsheet.getSheets()[0];
  rosterSheet.setName(settings.rosterSheetName);
  setupRosterSheet_(rosterSheet, settings);

  const memberSheet = spreadsheet.insertSheet(settings.memberSheetName);
  setupMemberSheet_(memberSheet);

  applyDropdowns_(rosterSheet, memberSheet, settings);
  spreadsheet.setActiveSheet(rosterSheet);

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
      "templateFolderId が未設定です。config_roster.js に作成先フォルダのURLを設定するか，" +
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

// 当番表シートの見出しと書式を作る。
function setupRosterSheet_(sheet, settings) {
  const columns = resolveColumns_(settings.assigneeColumnCount);
  const headers = buildHeaderRow_(settings.assigneeColumnCount);
  const lastRow = ROW.DATA_START + settings.rosterRowCount - 1;

  sheet.clear();
  trimColumns_(sheet, columns.totalColumnCount);
  trimRows_(sheet, lastRow);

  sheet.getRange(ROW.HEADER, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(1, 1, lastRow, columns.totalColumnCount)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBorder(true, true, true, true, true, true);

  sheet.getRange(ROW.HEADER, 1, 1, columns.totalColumnCount)
    .setFontWeight("bold")
    .setBackground("#d9ead3");

  sheet.setFrozenRows(ROW.HEADER);
  sheet.setRowHeight(ROW.HEADER, 32);

  const dataRows = settings.rosterRowCount;

  // 日付列は年まで表示する。9/17 が何年か迷わないようにするため。
  // 入力規則を日付にしておくと，セルをダブルクリックしたときに
  // カレンダーから選べるようになる。
  const dateRange = sheet.getRange(ROW.DATA_START, columns.dutyDateIndex + 1, dataRows, 2);

  dateRange.setNumberFormat("yyyy/MM/dd");
  dateRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireDate()
      .setAllowInvalid(true)
      .setHelpText("セルをダブルクリックすると，カレンダーから日付を選べます。")
      .build()
  );

  // 内容とメモは左揃えのほうが読みやすい。
  sheet.getRange(ROW.DATA_START, columns.contentNumber, dataRows, 2)
    .setHorizontalAlignment("left");

  // 通知済み列はチェックボックスにする。
  // 通知を送るとチェックが入り，外せばもう一度送れる。
  sheet.getRange(ROW.DATA_START, columns.sentNumber, dataRows, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build())
    .setValue(false);

  // No. 列に 1..n を入れておく。回番号は書き換えてよい。
  const numbers = [];

  for (let i = 1; i <= dataRows; i += 1) {
    numbers.push([i]);
  }

  sheet.getRange(ROW.DATA_START, columns.noIndex + 1, dataRows, 1).setValues(numbers);

  sheet.setColumnWidth(columns.noIndex + 1, WIDTH.no);
  sheet.setColumnWidth(columns.dutyDateIndex + 1, WIDTH.date);
  sheet.setColumnWidth(columns.noticeDateIndex + 1, WIDTH.date);

  for (let i = 0; i < columns.assigneeCount; i += 1) {
    sheet.setColumnWidth(columns.assigneeFromNumber + i, WIDTH.assignee);
  }

  sheet.setColumnWidth(columns.contentNumber, WIDTH.content);
  sheet.setColumnWidth(columns.memoNumber, WIDTH.memo);
  sheet.setColumnWidth(columns.sentNumber, WIDTH.sent);
}

// 名簿シートの見出しと書式を作る。
// Discord ID は18桁前後の数字で，数値扱いすると桁が落ちる。
// そのため書式を「書式なしテキスト」にしておく。
function setupMemberSheet_(sheet) {
  const headers = buildMemberHeaderRow_();
  const rowCount = MEMBER_RANGE_ROWS;

  sheet.clear();
  trimColumns_(sheet, headers.length);
  trimRows_(sheet, rowCount);

  sheet.getRange(1, colIndex_(MEMBER_COL.DISCORD_ID.col) + 1, rowCount, 1)
    .setNumberFormat("@");

  sheet.getRange(MEMBER_ROW.HEADER, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(1, 1, rowCount, headers.length)
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, true, true);

  sheet.getRange(MEMBER_ROW.HEADER, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");

  sheet.setFrozenRows(MEMBER_ROW.HEADER);
  sheet.setRowHeight(MEMBER_ROW.HEADER, 32);

  MEMBER_WIDTHS.forEach(function(width, index) {
    sheet.setColumnWidth(index + 1, width);
  });
}

// 担当者列と内容列にプルダウンを設定する。
//
// 担当者列は名簿シートの範囲を参照する。値を配列で埋め込むと，
// メンバーを追加するたびに再実行が必要になるため。
// 範囲参照にしておくと，名簿へ行を足すだけで候補が増える。
function applyDropdowns_(rosterSheet, memberSheet, settings) {
  const columns = resolveColumns_(settings.assigneeColumnCount);
  const rowCount = Math.max(rosterSheet.getMaxRows() - ROW.DATA_START + 1, 1);

  const memberRange = memberSheet.getRange(
    MEMBER_ROW.DATA_START, colIndex_(MEMBER_COL.NAME.col) + 1, MEMBER_RANGE_ROWS, 1
  );

  // 名簿に無い名前は入力できないようにする。
  // 打ち間違いでメンションが飛ばなくなる事故を防ぐのが目的。
  const assigneeRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(memberRange, true)
    .setAllowInvalid(false)
    .setHelpText("名簿シートの名前から選んでください。担当者がいない回は空欄にします。")
    .build();

  rosterSheet
    .getRange(ROW.DATA_START, columns.assigneeFromNumber, rowCount, columns.assigneeCount)
    .setDataValidation(assigneeRule);

  // 内容列は，候補から選ぶことも自由に書くこともできるようにする。
  // setAllowInvalid(true) のため，候補に無い内容も入力できる。
  const contentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONTENT_CHOICES, true)
    .setAllowInvalid(true)
    .setHelpText("一覧から選ぶか，自由に入力できます。")
    .build();

  rosterSheet
    .getRange(ROW.DATA_START, columns.contentNumber, rowCount, 1)
    .setDataValidation(contentRule);

  return rowCount;
}

// 使わない列を削除する。既定の26列のままだと右側に空列が残るため。
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
