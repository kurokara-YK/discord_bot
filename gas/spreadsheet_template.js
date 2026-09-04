/****************************************************
 * spreadsheet_template.gs
 * ==================================================
 * 学習用スプレッドシートテンプレートの作成
 *
 * 作成されるシートは sentenceSheetName の1つだけ。
 * 記入例あり／なしのどちらで作るかは呼び出し側が決める。
 ****************************************************/

// 学習データシートの見出し行。
const ENGLISH_LEARNING_SHEET_HEADER = ["No.", "英文", "日本語訳", "英語チャンク", "日本語チャンク"];

// 見出し以外の各列の幅（ピクセル）。見出しと同じ並び順。
const ENGLISH_LEARNING_COLUMN_WIDTHS = [70, 360, 360, 360, 360];

// 書式を適用する行数。ここまでは追記しても枠線と中央揃えが効く。
const ENGLISH_LEARNING_FORMATTED_ROW_COUNT = 1000;

// 学習データシートを持つ新規スプレッドシートを作成する。
// dataRows に配列を渡すと，見出しの下へ記入例として書き込む。
function createEnglishLearningSpreadsheetTemplate_(settings, dataRows) {
  const spreadsheet = SpreadsheetApp.create(settings.templateFileName);
  const sentenceSheet = spreadsheet.getSheets()[0];

  sentenceSheet.setName(settings.sentenceSheetName);
  setupEnglishLearningSentenceSheet_(sentenceSheet, dataRows);

  moveEnglishLearningSpreadsheetToFolder_(spreadsheet.getId(), settings.templateFolderId);

  return {
    spreadsheetId: spreadsheet.getId(),
    url: spreadsheet.getUrl(),
    name: spreadsheet.getName(),
    sheetName: sentenceSheet.getName(),
    dataRowCount: (dataRows || []).length
  };
}

// 学習データシートの見出し・データ行・書式を作る。
function setupEnglishLearningSentenceSheet_(sheet, dataRows) {
  const columnCount = ENGLISH_LEARNING_SHEET_HEADER.length;
  const rows = [ENGLISH_LEARNING_SHEET_HEADER].concat(dataRows || []);

  sheet.clear();
  trimEnglishLearningSheetToColumns_(sheet, columnCount);
  sheet.getRange(1, 1, rows.length, columnCount).setValues(rows);

  applyEnglishLearningSheetFormat_(sheet, columnCount);
  applyEnglishLearningHeaderFormat_(sheet, columnCount);
}

// 中央揃え・折り返し・枠線をまとめて適用する。
// 見出しとデータ行だけでなく，まだ空の行にも先に適用しておく。
// こうしておくと，あとから行を追加しても枠線と中央揃えがそのまま効く。
function applyEnglishLearningSheetFormat_(sheet, columnCount) {
  const rowCount = Math.min(sheet.getMaxRows(), ENGLISH_LEARNING_FORMATTED_ROW_COUNT);

  sheet.getRange(1, 1, rowCount, columnCount)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBorder(true, true, true, true, true, true);
}

// 見出し行を強調し，列幅をそろえる。
function applyEnglishLearningHeaderFormat_(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight("bold")
    .setBackground("#d9ead3");

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 48);

  ENGLISH_LEARNING_COLUMN_WIDTHS.forEach(function(width, index) {
    sheet.setColumnWidth(index + 1, width);
  });
}

// 使わない列を削除する。既定の 26 列のままだと右側に空列が残るため。
function trimEnglishLearningSheetToColumns_(sheet, columnCount) {
  const extraColumns = sheet.getMaxColumns() - columnCount;

  if (extraColumns > 0) {
    sheet.deleteColumns(columnCount + 1, extraColumns);
  }
}

// 作成したスプレッドシートを指定フォルダへ移動する。
// フォルダが未指定の場合は，マイドライブ直下へ作られたままにする。
function moveEnglishLearningSpreadsheetToFolder_(spreadsheetId, folderId) {
  if (!folderId) {
    return;
  }

  if (isEnglishLearningPlaceholder_(folderId)) {
    throw new Error(
      "moveEnglishLearningSpreadsheetToFolder_: templateFolderId が未設定です。" +
      "config_english.js の templateFolderId に，作成先の Google ドライブのフォルダのURLを設定してください。"
    );
  }

  DriveApp.getFileById(spreadsheetId).moveTo(DriveApp.getFolderById(folderId));
}
