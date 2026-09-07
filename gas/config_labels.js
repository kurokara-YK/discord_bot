/****************************************************
 * config_labels.gs
 * ==================================================
 * 通知対象ラベルとラベル同期用サンプル予定の設定
 *
 * Googleカレンダーは，ラベルに付けた名前をプログラムへ渡してくれない。
 * 届くのは色番号だけなので，「この予定と同じ色を，この名前で呼ぶ」という形で
 * BOTに教える必要がある。それがこのファイル。
 *
 *   1. config_calendar.js の CALENDAR_BOOK にカレンダーを登録する
 *   2. その呼び名で CALENDAR_LABEL_PROFILES にラベル設定を書く
 *   3. 各ラベルの色が付いた実在の予定を seeds に書く（件名＝ラベル名なら省略可）
 *   4. sync_calendar_label_registry を実行して色を覚えさせる（最初の1回だけ）
 *
 * 色番号の意味はカレンダーごとに違うため，対応表はカレンダー単位で持つ。
 * config_calendar.js の calendarId を呼び名で書き換えると，
 * 対応表も自動でそのカレンダー用のものへ切り替わる。
 *
 * 全予定を通知する場合（targetEventLabels: false）は編集不要。
 * → 詳しくは docs/label_setup.md
 ****************************************************/
const CALENDAR_LABEL_PROFILES = {

  // ------------------------------------------------
  // メインカレンダー用
  // 下記は記入例。自分のカレンダーに実在する予定へ置き換えること。
  // ------------------------------------------------
  "メインカレンダー": {
    seeds: [
      { labelName: "超重要",     sampleDate: "2026/04/01", sampleEventTitle: "健康診断" },
      { labelName: "重要",       sampleDate: "2026/04/06", sampleEventTitle: "資格試験の申し込み締切" },
      { labelName: "会社タスク", sampleDate: "2026/04/05", sampleEventTitle: "定例ミーティング" },
      { labelName: "アルバイト", sampleDate: "2026/04/08" },
      { labelName: "趣味創作",   sampleDate: "2026/04/05", sampleEventTitle: "GASプログラム開発" },
      { labelName: "完了",       sampleDate: "2026/04/05", sampleEventTitle: "提出書類の作成" }
    ]
  },

  // ------------------------------------------------
  // サブカレンダー用
  // 見本の予定が実在しないラベルは，実行ログに
  // 「サンプル予定が見つかりません」と出る。
  // サブカレンダー2 を使うなら，同じ形でブロックを足す。
  // ------------------------------------------------
  "サブカレンダー1": {
    seeds: [
      { labelName: "超重要",           sampleDate: "2026/04/01", sampleEventTitle: "全体会議" },
      { labelName: "重要",             sampleDate: "2026/04/06", sampleEventTitle: "資料の提出期限" },
      { labelName: "チームミーティング", sampleDate: "2026/04/07" },
      { labelName: "チームタスク",      sampleDate: "2026/04/07" },
      { labelName: "完了",             sampleDate: "2026/04/05", sampleEventTitle: "議事録の作成" }
    ]
  }
};

// どのプロファイルにも当てはまらないカレンダーで使う既定値。
// 色なしの予定だけを「デフォルト」として扱う。
const CALENDAR_LABEL_PROFILE_FALLBACK = {
  labels: ["デフォルト"],
  seeds: []
};
