/****************************************************
 * config_labels.gs
 * ==================================================
 * 通知対象ラベルとラベル同期用サンプル予定の設定
 *
 * Googleカレンダーは，ラベルに付けた名前をプログラムへ渡してくれない。
 * 届くのは色番号だけなので，「この予定と同じ色を，この名前で呼ぶ」という形で
 * BOTに教える必要がある。それがこのファイル。
 *
 *   1. 通知したいラベル名を CALENDAR_REMINDER_LABELS に並べる
 *   2. 各ラベルの色が付いた実在の予定を CALENDAR_LABEL_REGISTRY_SEEDS に書く
 *   3. sync_calendar_label_registry を実行して色を覚えさせる（最初の1回だけ）
 *
 * 全予定を通知する場合（targetEventLabels: false）は編集不要。
 * → 詳しくは docs/label_setup.md
 ****************************************************/

// 通知したいラベル名。ここに書いた名前の予定だけが通知される。
// 名前は自由に決めてよい。通知本文では [会社タスク] のように表示される。
// 「デフォルト」は特別な名前で，色なしの予定に自動で割り当てられる。
// 使うには config_calendar.js を targetEventLabels: CALENDAR_REMINDER_LABELS にする。
const CALENDAR_REMINDER_LABELS = [
  "重要",
  "超重要",
  "趣味創作",
  "会社タスク",
  "アルバイト",
  "完了",
  "デフォルト"
];

// 各ラベルの色を覚えさせるためのサンプル予定。
//   labelName        … 上と同じラベル名
//   sampleEventTitle … その色が付いた予定の件名（カレンダーの表示と完全一致）
//   sampleDate       … その予定の日付。"2026/04/06" の形式。前後30日を探す
// 「デフォルト」は色なしを指すため，ここに書かなくてよい。
//
//   {
//     labelName: "ラベルの名前を入れる",
//     sampleEventTitle: "その色が付いている予定の件名を入れる",
//     sampleDate: "その予定の日付を入れる"
//   },
//
// 下記は記入例。自分のカレンダーに実在する予定へ置き換えること。
const CALENDAR_LABEL_REGISTRY_SEEDS = [
  {
    labelName: "重要",
    sampleEventTitle: "資格試験の申し込み締切",
    sampleDate: "2026/04/06"
  },
  {
    labelName: "超重要",
    sampleEventTitle: "健康診断",
    sampleDate: "2026/04/01"
  },
  {
    labelName: "趣味創作",
    sampleEventTitle: "GASプログラム開発",
    sampleDate: "2026/04/05"
  },
  {
    labelName: "会社タスク",
    sampleEventTitle: "定例ミーティング",
    sampleDate: "2026/04/05"
  },
  {
    labelName: "アルバイト",
    sampleEventTitle: "アルバイト",
    sampleDate: "2026/04/08"
  },
  {
    labelName: "完了",
    sampleEventTitle: "提出書類の作成",
    sampleDate: "2026/04/05"
  }
];
