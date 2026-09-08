/****************************************************
 * config_huggingface.gs
 * ==================================================
 * Hugging Face 通知BOT の設定ファイル
 *
 * 各項目の意味と決め方は README.md を参照すること。
 *
 * 【注意】
 *   このファイルには Webhook URL と合言葉が入る。
 *   GitHub へは push しないこと。
 ****************************************************/

// HF アクセストークンの保存先（スクリプト プロパティの名前）。
// この行は書き換えなくてよい。
const HUGGINGFACE_TOKEN_PROPERTY_KEY = "HF_ACCESS_TOKEN";

// HF アクセストークン。
//
// ここに貼って main.gs の save_access_token を実行すると，
// スクリプト プロパティへ保存される。保存後はこの行を空にしてよい。
//
// 設定は任意。private リポジトリの作者名とコミットメッセージを
// 通知に出したい場合だけ設定する。権限は Read のみでよい。
const HUGGINGFACE_ACCESS_TOKEN = "ここにHugging Faceのアクセストークンを入れてください";

const HUGGINGFACE_NOTIFY_SETTINGS = {
  // 実行ログに出す表示名。
  label: "Hugging Face 連携 Discord 通知BOT",

  // Discord Webhook URL。
  // チャンネル設定 → 連携サービス → ウェブフック から取得する。
  webhookUrl: "ここにDiscordのWebhook URLを入れてください",

  // このBOT専用の合言葉。
  // main.gs の step1_make_token を実行して発行した値を貼る。
  webhookToken: "ここにstep1_make_tokenで発行した合言葉を入れてください",

  // デプロイ画面に表示された「ウェブアプリ URL」。
  // ?token= より前の部分だけを貼る。末尾は /exec になる。
  // 「デプロイ」→「デプロイを管理」からいつでも確認できる。
  webAppUrl: "ここにデプロイしたウェブアプリのURLを入れてください",

  // 通知するリポジトリの種別。false ならすべて。
  // 例）["model", "dataset"]
  targetRepoTypes: false,

  // 通知するリポジトリ名。false ならすべて。
  // 例）["kurokara-YK/3d-printing-models"]
  targetRepos: false,

  // private リポジトリも通知するか。
  notifyPrivateRepos: true,

  // push した人の名前を表示するか。
  showAuthor: true,

  // HF の API で作者名・コミットメッセージ・時刻を補完するか。
  fetchCommitDetails: true,

  // コミットメッセージを何文字で切り詰めるか。
  commitMessageMaxLength: 100,

  // refs/pr/* （プルリクエスト）の更新も通知するか。
  notifyPullRequestRefs: true,

  // ブランチやリポジトリの削除も通知するか。
  notifyOnDelete: true,

  // 処理に失敗したとき，エラーを Discord へ送るか。
  notifyErrorsToDiscord: true
};
