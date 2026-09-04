/****************************************************
 * spreadsheet_reader.gs
 * ==================================================
 * 学習用スプレッドシートの読み取り
 ****************************************************/

// 学習データシートの列位置。見出しの並び順と対応する。
const ENGLISH_LEARNING_COLUMN_INDEX = {
  number: 0,
  english: 1,
  japanese: 2,
  englishChunk: 3,
  japaneseChunk: 4
};

// 設定から対象スプレッドシートを開く。
function openEnglishLearningSpreadsheet_(settings, callerName) {
  if (!settings.spreadsheetId || isEnglishLearningPlaceholder_(settings.spreadsheetId)) {
    throw new Error(
      callerName + ": spreadsheetId が未設定です。" +
      "config_english.js の spreadsheetId に，学習データのスプレッドシートのURLを設定してください。"
    );
  }

  return SpreadsheetApp.openById(settings.spreadsheetId);
}

// 学習データシートを開く。
function openEnglishLearningSentenceSheet_(settings, callerName) {
  const spreadsheet = openEnglishLearningSpreadsheet_(settings, callerName);
  const sheet = spreadsheet.getSheetByName(settings.sentenceSheetName);

  if (!sheet) {
    throw new Error(
      callerName + ": シートが見つかりません。sheetName=" + settings.sentenceSheetName +
      " / config_english.js の sentenceSheetName と，実際のシート名が一致しているか確認してください。"
    );
  }

  return sheet;
}

// 学習データを読み込み，No. の昇順で返す。
// No. が数値でない行と，英文も日本語訳も空の行は読み飛ばす。
function getEnglishLearningEntries_(settings) {
  const sheet = openEnglishLearningSentenceSheet_(settings, "getEnglishLearningEntries_");
  const values = sheet.getDataRange().getDisplayValues();

  // 1行目は見出しのため，データが無ければ空配列を返す。
  if (values.length <= 1) {
    return [];
  }

  return values.slice(1)
    .map(toEnglishLearningEntry_)
    .filter(function(entry) {
      return entry !== null;
    })
    .sort(function(a, b) {
      return a.number - b.number;
    });
}

// シートの1行を学習データへ変換する。読み飛ばす行は null を返す。
function toEnglishLearningEntry_(row) {
  const index = ENGLISH_LEARNING_COLUMN_INDEX;
  const number = parseInt(readEnglishLearningCell_(row, index.number), 10);
  const english = readEnglishLearningCell_(row, index.english);
  const japanese = readEnglishLearningCell_(row, index.japanese);

  if (isNaN(number) || (!english && !japanese)) {
    return null;
  }

  return {
    number: number,
    english: english,
    japanese: japanese,
    englishChunk: readEnglishLearningCell_(row, index.englishChunk),
    japaneseChunk: readEnglishLearningCell_(row, index.japaneseChunk)
  };
}

// セルの値を文字列として取り出す。
function readEnglishLearningCell_(row, columnIndex) {
  return String(row[columnIndex] || "").trim();
}

// 現在利用中のスプレッドシート名とURLを返す。
function getEnglishLearningSpreadsheetInfo_(settings) {
  const spreadsheet = openEnglishLearningSpreadsheet_(settings, "getEnglishLearningSpreadsheetInfo_");

  return {
    id: settings.spreadsheetId,
    name: spreadsheet.getName(),
    url: spreadsheet.getUrl()
  };
}
