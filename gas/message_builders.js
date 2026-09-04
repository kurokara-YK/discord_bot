/****************************************************
 * message_builders.gs
 * ==================================================
 * 送信対象の選択と，Discord 送信本文の組み立て
 *
 * 1文につき 1 メッセージを作る。
 * 複数文をまとめて 1 メッセージに詰めることはしない。
 ****************************************************/

// チャンクの区切り記号。スプレッドシートの入力と表示の両方で使う。
const ENGLISH_LEARNING_CHUNK_SEPARATOR = "｜";

// 表示用の区切り。前後に空白を入れて読みやすくする。
const ENGLISH_LEARNING_CHUNK_DISPLAY_SEPARATOR = " " + ENGLISH_LEARNING_CHUNK_SEPARATOR + " ";

// ---------------------------------------------------
// 送信対象の選択
// ---------------------------------------------------

// 順番またはランダムで送信対象文を選ぶ。
function pickEnglishLearningEntries_(settings) {
  const entries = getEnglishLearningEntries_(settings).filter(function(entry) {
    return entry.number >= settings.startNumber;
  });

  if (entries.length === 0) {
    return [];
  }

  if (settings.sendMode === "random") {
    return pickRandomEnglishLearningEntries_(entries, settings.batchSize);
  }

  return pickSequentialEnglishLearningEntries_(entries, settings);
}

// 順番送信対象を選び，次回開始位置を保存する。
// 最後の文まで送り終えたら先頭には戻らず，そこで停止する。
function pickSequentialEnglishLearningEntries_(entries, settings) {
  const progress = getEnglishLearningProgress_();
  const desiredStartNumber = Math.max(progress.nextNumber, settings.startNumber);
  const startIndex = findEnglishLearningEntryIndexByNumber_(entries, desiredStartNumber);

  if (startIndex === -1) {
    Logger.log(
      "最後の文まで送信済みのため停止します。先頭から送り直すには reset_english_learning_progress を実行してください。" +
      " nextNumber=" + desiredStartNumber
    );
    return [];
  }

  // slice は範囲を超えた分を切り詰めるため，末尾では自然に残り件数だけになる。
  const selected = entries.slice(startIndex, startIndex + settings.batchSize);

  saveEnglishLearningProgress_(selected[selected.length - 1].number + 1);
  return selected;
}

// ランダム送信対象を選ぶ。進捗は保存しないため停止しない。
function pickRandomEnglishLearningEntries_(entries, batchSize) {
  return shuffleArray_(entries).slice(0, Math.min(batchSize, entries.length));
}

// ---------------------------------------------------
// 本文の組み立て
// ---------------------------------------------------

// 送信対象の各文から，Discord へ送る本文の配列を作る。
function buildEnglishLearningMessages_(settings, entries) {
  // シートへのリンクは全メッセージで共通のため，ここで1度だけ作る。
  const spreadsheetLink = buildEnglishLearningSpreadsheetLink_(settings);
  const messages = [];

  (entries || []).forEach(function(entry) {
    const message = buildEnglishLearningEntryMessage_(settings, entry) + "\n\n" + spreadsheetLink;

    // 1文だけで上限を超える場合は分割できないため，その文を飛ばして残りの送信を続ける。
    if (message.length > settings.discordMessageMaxLength) {
      Logger.log(
        "buildEnglishLearningMessages_: 本文が長すぎるため送信を見送ります。No.=" +
        entry.number + ", length=" + message.length +
        ", 上限=" + settings.discordMessageMaxLength
      );
      return;
    }

    messages.push(message);
  });

  return messages;
}

// 1文ぶんの本文を組み立てる。
function buildEnglishLearningEntryMessage_(settings, entry) {
  const lines = [
    "【" + settings.messageTitlePrefix + " No." + entry.number + "】",
    "```text",
    entry.english,
    "```",
    entry.japanese,
    "",
    buildEnglishLearningEnglishChunkLine_(settings, entry),
    normalizeChunkText_(entry.japaneseChunk)
  ];
  const sentenceLink = buildEnglishLearningSentenceLink_(settings, entry);

  if (sentenceLink) {
    lines.push("", sentenceLink);
  }

  return lines.join("\n").trim();
}

// 英語チャンク行を組み立てる。
// 各チャンクだけを Google翻訳リンクにし，区切りの ｜ はリンクの外へ出す。
function buildEnglishLearningEnglishChunkLine_(settings, entry) {
  const chunks = splitChunkText_(entry.englishChunk);

  if (chunks.length === 0) {
    return "";
  }

  if (!settings.chunkLinkEnabled) {
    return chunks.join(ENGLISH_LEARNING_CHUNK_DISPLAY_SEPARATOR);
  }

  return chunks
    .map(function(chunk) {
      return buildDiscordMaskedLink_(chunk, buildEnglishLearningTranslateUrl_(settings, chunk));
    })
    .join(ENGLISH_LEARNING_CHUNK_DISPLAY_SEPARATOR);
}

// 全文を入力済みにした Google翻訳リンクを作る。
function buildEnglishLearningSentenceLink_(settings, entry) {
  if (!settings.sentenceLinkEnabled || !entry.english) {
    return "";
  }

  return buildDiscordMaskedLink_(
    settings.sentenceLinkLabel,
    buildEnglishLearningTranslateUrl_(settings, entry.english)
  );
}

// 設定の翻訳言語を使って Google翻訳 URL を作る。
function buildEnglishLearningTranslateUrl_(settings, text) {
  return buildGoogleTranslateUrl_(text, settings.translateSourceLang, settings.translateTargetLang);
}

// 学習データシートへのリンクを作る。
function buildEnglishLearningSpreadsheetLink_(settings) {
  const info = getEnglishLearningSpreadsheetInfo_(settings);
  return buildDiscordMaskedLink_(info.name, info.url);
}
