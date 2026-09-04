/****************************************************
 * state_store.gs
 * ==================================================
 * 順番送信の進捗管理
 ****************************************************/

const ENGLISH_LEARNING_NEXT_NUMBER_PROPERTY_KEY = "ENGLISH_LEARNING_NEXT_NUMBER";

// 保存済み進捗を返す。
function getEnglishLearningProgress_() {
  const raw = PropertiesService.getScriptProperties().getProperty(ENGLISH_LEARNING_NEXT_NUMBER_PROPERTY_KEY);

  return {
    nextNumber: Math.max(1, toIntegerOrDefault_(raw, 1))
  };
}

// 次回開始番号を保存する。
function saveEnglishLearningProgress_(nextNumber) {
  PropertiesService.getScriptProperties().setProperty(
    ENGLISH_LEARNING_NEXT_NUMBER_PROPERTY_KEY,
    String(Math.max(1, toIntegerOrDefault_(nextNumber, 1)))
  );
}

// 保存済み進捗を削除する。
function clearEnglishLearningProgress_() {
  PropertiesService.getScriptProperties().deleteProperty(ENGLISH_LEARNING_NEXT_NUMBER_PROPERTY_KEY);
}
