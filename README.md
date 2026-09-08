<a name="readme-top"></a>

# Hugging Face 更新通知 Discord BOT

Hugging Faceのリポジトリが更新されたとき，Discordへ自動で通知するBOTです．

Googleアカウントがあれば無料で使えます．

<details>
  <summary>目次</summary>
  <ol>
    <li><a href="#どんなものか">どんなものか</a></li>
    <li><a href="#はじめての方へ">はじめての方へ</a></li>
    <li><a href="#必要なもの">必要なもの</a></li>
    <li><a href="#届くメッセージ">届くメッセージ</a></li>
    <li><a href="#使いはじめる">使いはじめる</a></li>
    <li><a href="#しくみ">しくみ</a></li>
    <li><a href="#合言葉webhooktoken">合言葉（webhookToken）</a></li>
    <li><a href="#hugging-face-の-webhook-設定">Hugging Face の Webhook 設定</a></li>
    <li><a href="#hugging-face-アクセストークン">Hugging Face アクセストークン</a></li>
    <li><a href="#設定項目一覧">設定項目一覧</a></li>
    <li><a href="#実行できる関数">実行できる関数</a></li>
    <li><a href="#ファイル構成">ファイル構成</a></li>
    <li><a href="#git管理上の注意">Git管理上の注意</a></li>
    <li><a href="#うまくいかないとき">うまくいかないとき</a></li>
    <li><a href="#関連資料">関連資料</a></li>
    <li><a href="#作成者">作成者</a></li>
    <li><a href="#ライセンス">ライセンス</a></li>
  </ol>
</details>

## どんなものか

Hugging Faceのリポジトリが更新されたとき，その内容をDiscordへ自動で知らせるBOTです．

Googleアカウントがあれば**無料**で使えます．パソコンの電源が切れていても動きます．

- 誰が，どのファイルを，どんな内容で更新したかが分かる
- 個人のリポジトリと，組織のリポジトリを両方まとめて見張れる
- 公開・非公開のどちらにも対応している

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 届くメッセージ

pushがあると，次のような通知が届きます．

```text
🤗 Hugging Face
[kurokara-YK/3d-printing-models:main] 1 new commit
> 2ae1f72  ファイルを追加しました — kurokara-YK
> 2026/09/08 09:35
🔗 コミットを見る
```

左から順に，コミットの番号，コミットメッセージ，更新した人の名前です．
「コミットを見る」を押すと，Hugging Faceの画面で変更内容を確認できます．

ブランチやタグを作ったとき，消したときも通知されます．

```text
[kurokara-YK/3d-printing-models:feature] 新しいブランチ
[kurokara-YK/3d-printing-models:tag v1.0] 新しいタグ
[kurokara-YK/3d-printing-models:old] ブランチが削除されました
```

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## はじめての方へ

プログラムを書いたことがなくても使えます．
ここでは，出てくる言葉をひととおり説明します．

### Hugging Face とは

AIのモデルやデータを置いておける，**インターネット上の保管場所**です．
GitHubに似ていますが，AI向けに作られており，大きなファイルを扱えます．

このBOTでは，3Dモデルなどのファイルを置いた場所として使います．

### リポジトリとは

ファイルをまとめて入れておく**フォルダのようなもの**です．
「誰が」「いつ」「何を変えたか」の記録が残るのが，普通のフォルダとの違いです．

### push（プッシュ）とは

自分のパソコンにあるファイルを，**インターネット上の保管場所へ送る**ことです．
このBOTは，このpushを見張って通知します．

### コミットとは

「ここまでの変更をひとまとまりとして記録する」という操作です．
1回のコミットには，変更内容と，それを説明する短い文章（コミットメッセージ）が付きます．

通知に出る `Add b.txt` のような文字が，このコミットメッセージです．

### Webhook（ウェブフック）とは

**何かが起きたとき，別のサービスへ自動で知らせるしくみ**です．

このBOTでは，Hugging Faceで更新が起きたときに，
その知らせがGoogleのサーバーへ届き，そこからDiscordへ転送されます．

```text
Hugging Face で更新
    ↓ Webhook（更新の知らせ）
Google Apps Script（このBOT）
    ↓
Discord に通知が届く
```

### Google Apps Script（GAS）とは

Googleが無料で提供している，**Googleのサーバー上でプログラムを動かすしくみ**です．

自分のパソコンを起動しておく必要がありません．
このBOTの本体は，ここで動きます．

### トークンとは

**パスワードの代わりになる文字列**です．
このBOTでは3種類のトークンが出てきますが，役割はそれぞれ違います．

| 名前 | 何のためのものか | どこで作るか |
| --- | --- | --- |
| Discord Webhook URL | Discordへ書き込むための住所 | Discordのチャンネル設定 |
| 合言葉（webhookToken） | このBOTへの不正な書き込みを防ぐ | このBOTが自動で作る |
| Hugging Face アクセストークン | 非公開リポジトリを読むため | Hugging Faceの設定画面 |

**どれも他人に見せないでください．**
名前が似ていて混乱しやすいので，出てきたときに都度説明します．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 必要なもの

作りはじめる前に，次の3つを用意してください．

| 必要なもの | 用意する方法 | 費用 |
| --- | --- | --- |
| Googleアカウント | すでにGmailを使っていればそれでよい | 無料 |
| Discordのアカウントとサーバー | 通知を受け取るチャンネルが必要 | 無料 |
| Hugging Faceのアカウント | <https://huggingface.co/join> で登録 | 無料 |

Discordの**サーバー**は，自分専用のものでも構いません．
チャンネルの設定を変えられる権限（管理者）が必要です．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 使いはじめる

大まかな流れは次のとおりです．

1. DiscordでWebhook URLを取得する
2. Apps Scriptにコードを反映する
3. `step1_make_token` を実行して合言葉を発行する
4. 出力された合言葉を `gas/config_huggingface.js` に貼り付ける
5. ウェブアプリとしてデプロイし，表示されたURLをコピーする
6. コピーしたURLを `gas/config_huggingface.js` の `webAppUrl` に貼り付ける
7. `step2_show_webhook_url` を実行し，登録用のURLを受け取る
8. そのURLをHugging Faceの [Webhooks設定](https://huggingface.co/settings/webhooks) に登録する
9. 実際にpushして通知を確認する

privateリポジトリで作者名やコミットメッセージも表示したい場合は，
通知が届くことを確認したあとで
[Hugging Face アクセストークン](#hugging-face-アクセストークン)を設定してください．
最初から設定する必要はありません．

手順が2つに分かれているのは，**ウェブアプリのURLがデプロイ後でないと決まらない**ためです．

### 1. Discord Webhook URLを取得する

通知を受け取りたいチャンネルで，次の順に進みます．

```text
チャンネル名の横の歯車（チャンネルの編集）
  → 連携サービス
  → ウェブフック
  → 新しいウェブフック
  → ウェブフックURLをコピー
```

コピーしたURLを `gas/config_huggingface.js` の `webhookUrl` に貼り付けます．

> **注意**
> このURLを知っている人は，そのチャンネルへ自由に書き込めます．
> 他人に見せたり，インターネット上へ貼ったりしないでください．
> 誤って公開した場合は，同じ画面からウェブフックを削除して作り直します．

### 2. Apps Scriptにコードを入れる

Googleにログインした状態で <https://script.google.com/> を開き，
「新しいプロジェクト」を作ります．

左側のファイル一覧の「＋」から，`gas` フォルダにある**すべてのファイル**を
同じ名前で作り，中身を貼り付けてください．

| GAS上で作るファイル名 | 元のファイル |
| --- | --- |
| `config_huggingface.gs` | `gas/config_huggingface.js` |
| `main.gs` | `gas/main.js` |
| （以下同様） | `gas/` 内の残りすべて |

拡張子は，GAS上では `.gs` になります．中身はそのままで構いません．

> **補足**
> ファイル数が多いため，`clasp` という道具を使うと一括で送れます．
> ただし，はじめのうちは手で貼り付けても問題ありません．

### 3. デプロイする

**デプロイとは，コードを外部から呼び出せるURLとして公開する操作です．**

Apps Scriptは通常，エディタで「実行」を押したときだけ動きます．
しかしHugging Faceは，あなたのエディタを押せません．
そこで**呼び出せる住所（URL）を発行する**のがデプロイです．

#### 手順

画面**右上**の青い「デプロイ」ボタンから進みます．

1. 「デプロイ」→「新しいデプロイ」
2. 歯車のアイコン（⚙）→「ウェブアプリ」を選ぶ
3. 次のとおり設定する

| 項目 | 設定する値 |
| --- | --- |
| 次のユーザーとして実行 | **自分** |
| アクセスできるユーザー | **全員** |

4. 「デプロイ」を押す（初回は権限の承認画面が出ます）
5. 表示された**ウェブアプリURL**をコピーし，`gas/config_huggingface.js` の `webAppUrl` に貼り付ける

> **重要**
> 「アクセスできるユーザー」を**全員**にしてください．
> Hugging Faceはログイン情報を持たないため，これ以外では通知が届きません．

#### コードを直したとき

「デプロイ」→「デプロイを管理」から，**既存のデプロイを編集**してください．
鉛筆のアイコンを押し，バージョンを「新バージョン」にして更新します．

「新しいデプロイ」を作るとURLが変わり，Hugging Face側の登録し直しになります．

#### 何を変えたら再デプロイが必要か

| 変えたもの | 再デプロイ | Hugging Faceの登録 |
| --- | --- | --- |
| コード | **必要** | そのまま |
| `webhookToken` | 不要 | **やり直し**（URLに含まれるため） |
| `webAppUrl` | 不要 | そのまま |
| Discord Webhook URL | 不要 | そのまま |

古いデプロイが増えて分かりにくくなった場合は，
「デプロイを管理」から**アーカイブ**できます．
アーカイブは一覧から隠す操作で，Apps Scriptに完全な削除はありません．
現役のデプロイは残してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## しくみ

```text
Hugging Face          … リポジトリが更新される
        ↓ Webhook（更新の知らせをPOSTで送る）
Google Apps Script    … 合言葉を確認し，内容を読んで本文を組み立てる
        ↓ Hugging Face API（作者名・コミットメッセージを補う）
Discord Webhook       … チャンネルへ通知が届く
```

**Google Apps Script（GAS）** はGoogleが無料で提供している
「Googleのサーバー上でプログラムを動かす仕組み」です．
自分のパソコンの電源が切れていても動きます．

Hugging Faceから届く知らせには，**リポジトリ名・ブランチ・コミットのSHAまで**しか入っていません．
作者名やコミットメッセージは含まれないため，BOT側からHugging FaceのAPIを呼んで補っています．
この補完に失敗しても，通知そのものは止まりません．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 合言葉（webhookToken）

`webhookToken` は，**このBOTのためだけに決める文字列**です．
Hugging Faceのトークンでも，Discordのパスワードでもありません．

### なぜ必要なのか

このBOTのURLは「アクセスできるユーザー: 全員」で公開します．
Hugging Face側がログイン情報を送れないため，そうするしかありません．

合言葉がないと，URLを知った人が次の1行だけで
あなたのDiscordチャンネルへ好きな文面を投稿できてしまいます．

```sh
curl -X POST "https://script.google.com/macros/s/xxxxx/exec" -d '{"repo":{"name":"..."}}'
```

合言葉は，開けっ放しの玄関につける**暗証番号**にあたります．
番号が合わないリクエストは，本文を読む前に破棄されます．

### なぜURLに付けるのか

Hugging Faceは本来 `X-Webhook-Secret` というHTTPヘッダで合言葉を送りますが，
**GASはHTTPヘッダを読めません**．そのため登録するURLの末尾に
`?token=（合言葉）` を付けます．これは公式も認めている方法です．

通常のWebhookなら `/exec` だけで済みますが，GASではこの形になります．
Hugging Faceの `Secret` 欄は**空のままで構いません**．

### 覚えておく必要はあるか

**ありません．** 設定ファイルに書いておく値です．
分からなくなったときは `step2_show_webhook_url` で再表示できます．

合言葉は `step1_make_token` が自動で生成します．
自分で考えた文字列は使わないでください．

### 作り直すとき

漏れた可能性があるとき（GitHubへの誤push，画面共有で映ったなど）だけ，
`step1_remake_token` で作り直します．
作り直すとURLが変わるため，Hugging Face側の登録もやり直しになります．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## Hugging Face の Webhook 設定

Webhookは**リポジトリごとの設定画面にはありません**．
アカウント全体の設定として登録します．

<https://huggingface.co/settings/webhooks>

`Add a new webhook` を押し，次のように設定します．

| 項目 | 設定する値 |
| --- | --- |
| Target repositories | 監視したいリポジトリ，またはユーザー名・組織名 |
| Webhook type | **Webhook URL**（Jobではありません） |
| Webhook URL | `step2_show_webhook_url` が出力したURL |
| Secret | **空のままにする**（URLに `?token=` を付けているため） |
| Triggers | **Repo update** にチェック |

> **よくある間違い**
> `Webhook URL` の欄に，DiscordのWebhook URL
> （`https://discord.com/api/webhooks/…`）を貼らないでください．
>
> この欄に入れるのは**GASのウェブアプリURL**です．
> DiscordのURLは通知の**送り先**であり，設定ファイルの `webhookUrl` に書きます．
> 間違えると，Hugging Faceから送られたJSONがそのままDiscordへ流れ，
> BOTを経由しない読みにくい通知になります．

3つのURLは役割が異なります．混同しないでください．

| URL | 役割 | どこに書くか |
| --- | --- | --- |
| GASのウェブアプリURL | 通知を**受け取る**入口 | Hugging Faceの `Webhook URL` |
| Discord Webhook URL | 通知の**送り先** | `config_huggingface.js` の `webhookUrl` |
| Hugging Faceのリポジトリ | **監視する対象** | Hugging Faceの `Target repositories` |

### 監視する範囲

`Target repositories` には，リポジトリを1つずつ登録することも，
**ユーザー名や組織名をまとめて登録**することもできます．

| 入力する値 | 監視される範囲 |
| --- | --- |
| `kurokara-YK/3d-printing-models` | そのリポジトリだけ |
| `kurokara-YK` | 自分のすべてのリポジトリ |
| `kurokara-guider` | その組織のすべてのリポジトリ |

名前空間ごと登録しておくと，**新しくリポジトリを作るたびに追加する手間がなくなります**．
通知する対象を絞りたい場合は，`targetRepos` や `targetRepoTypes` で調整してください．

### Triggers の選び方

このBOTが使うのは `Repo update` だけです．

| 種類 | 内容 | 必要か |
| --- | --- | --- |
| Repo update | commit，タグ，ブランチの更新 | **必要** |
| Community (PR & discussions) | Pull Requestや議論 | 不要 |

### 動作の確認

登録後，Webhookの設定画面に **Activity** タブがあります．
送信されたデータとHTTPステータスコードを確認でき，`Replay` で再送もできます．
うまく動かないときは，まずここを見てください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## Hugging Face アクセストークン

`hf_` で始まるトークンのことです．**設定は任意で，あとから追加できます．**

### いつ設定するか

**最初は設定しなくて構いません．**
まず通知が届くことを確認し，「作者名も出したい」と思ったときに追加してください．

設定を追加しても，デプロイのやり直しやHugging Face側の再登録は不要です．

### 2つの定数の違い

`config_huggingface.js` には，名前の似た定数が2つあります．

```js
const HUGGINGFACE_TOKEN_PROPERTY_KEY = "HF_ACCESS_TOKEN";   // 保存先の名前
const HUGGINGFACE_ACCESS_TOKEN = "";                        // トークンの値
```

| 定数 | 中身 | 書き換えるか |
| --- | --- | --- |
| `HUGGINGFACE_TOKEN_PROPERTY_KEY` | 保存先（スクリプト プロパティ）の名前 | **不要** |
| `HUGGINGFACE_ACCESS_TOKEN` | トークンそのもの | **ここに貼る** |

前者はロッカーの番号札，後者が中身にあたります．

### 設定するとどう変わるか

| リポジトリの種類 | 未設定のとき | 設定したとき |
| --- | --- | --- |
| public | 作者名・コミットメッセージが表示される | 同じ |
| **private** | **その行が省かれる** | 作者名・コミットメッセージが表示される |

privateリポジトリを監視していて，**通知に作者名やコミットメッセージを出したい場合だけ**設定してください．
「どのブランチが更新されたか」だけで足りるなら，設定は不要です．

未設定でも通知そのものは正常に届きます．

### 発行のしかた

1. <https://huggingface.co/settings/tokens> を開きます
2. `Create new token` を押します
3. Token type で **`Fine-grained`** を選びます
4. `Repository permissions` で，読み取りたい範囲に **Read** を付けます

| 対象 | 付ける権限 | 読める範囲 |
| --- | --- | --- |
| `kurokara-YK`（個人） | Read | 自分のpublic・privateすべて |
| `kurokara-guider`（組織） | Read | 組織のpublic・privateすべて |

**両方に付ければ，1つのトークンで個人と組織の両方をカバーできます．**
publicリポジトリは認証なしでも読めるため，privateが読めれば十分です．

5. `Create token` を押し，表示された値をコピーします．**一度しか表示されません**

> **なぜ `Read` ではなく `Fine-grained` か**
> `Read` は「自分が読めるものすべて」に効きます．
> `Fine-grained` は範囲を限定できるため，万一漏れたときの影響が小さく，
> Hugging Face公式も本番用途にはこちらを推奨しています．

### 組織で運用する場合

Hugging Faceに**組織が所有するトークンはありません．** すべて個人のトークンです．
組織メンバーの個人トークンが，組織のprivateリポジトリを読む形になります．

そのため，発行した人が組織を抜けると通知が止まります．
長く運用する場合は，**BOT専用のHugging Faceアカウントを作り，組織に招待する**方法を推奨します．
担当者が変わっても影響を受けません．

トークンを差し替えるときは，スクリプト プロパティの値を変えるだけです．
再デプロイもHugging Face側の再登録も不要です．

> **注意**
> 組織がTeamまたはEnterpriseプランの場合，
> 組織を対象にしたトークンは**管理者の承認待ち**になることがあります．
> 承認されるまでは組織のリポジトリへのアクセスが `403` になります．

### 保存のしかた

`config_huggingface.js` の `HUGGINGFACE_ACCESS_TOKEN` に貼り，
`save_access_token` を実行します．

```js
const HUGGINGFACE_ACCESS_TOKEN = "ここにHugging Faceのアクセストークンを入れてください";
```

実行するとスクリプト プロパティへ保存され，以降はそちらが使われます．
保存後は設定ファイルの行を空にして構いません．

```js
const HUGGINGFACE_ACCESS_TOKEN = "";
```

| 関数 | 動作 |
| --- | --- |
| `save_access_token` | 設定ファイルの値をスクリプト プロパティへ保存する |
| `delete_access_token` | 保存したトークンを削除する |

トークンを入れ替えるときは，新しい値を貼って `save_access_token` を再実行します．
実行ログにトークンそのものは出力されず，`hf_YCW…OwTI／37文字` のように伏せ字で表示されます．

設定ファイルを空にせず残しておいても動作します．
その場合，スクリプト プロパティの値が優先されます．

> **なぜスクリプト プロパティに移すのか**
> `config_huggingface.js` は `.gitignore` で除外しているためGitには載りませんが，
> スクリプト プロパティへ移しておくと，設定ファイルを他の人へ渡すときや
> 画面を共有するときにトークンが目に入りません．
>
> ただしスクリプト プロパティは，Apps Scriptプロジェクトの
> **編集権限を持つ人なら誰でも閲覧できます．**
> 組織で使う場合は，プロジェクトの共有相手を必要な人だけに絞ってください．

トークンが漏れた場合は，[Access Tokens](https://huggingface.co/settings/tokens) から
削除して作り直してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 設定項目一覧

`gas/config_huggingface.js` で設定します．

### 接続先

| 設定名 | 内容 | 初期値 |
| --- | --- | --- |
| `label` | 実行ログに出す表示名 | Hugging Face 連携 Discord 通知BOT |
| `webhookUrl` | Discord Webhook URL | 未設定 |
| `webhookToken` | このBOT専用の合言葉 | 未設定 |
| `webAppUrl` | デプロイしたウェブアプリのURL | 未設定 |

### 通知の対象

| 設定名 | 内容 | 初期値 |
| --- | --- | --- |
| `targetRepoTypes` | 通知する種別．`false` ならすべて | `false` |
| `targetRepos` | 通知するリポジトリ名．`false` ならすべて | `false` |
| `notifyPrivateRepos` | privateリポジトリも通知するか | `true` |
| `notifyPullRequestRefs` | Pull Requestの更新も通知するか | `true` |
| `notifyOnDelete` | ブランチやタグの削除も通知するか | `true` |

`targetRepoTypes` には `["model", "dataset"]` のように書きます．
`targetRepos` には `["kurokara-YK/3d-printing-models"]` のように書きます．

> **注意**
> `notifyPrivateRepos` を `true` にすると，privateリポジトリのコミットメッセージが
> Discordへ流れます．送信先は必ず限定公開のチャンネルにしてください．

### 表示の内容

| 設定名 | 内容 | 初期値 |
| --- | --- | --- |
| `showAuthor` | pushした人の名前を表示するか | `true` |
| `fetchCommitDetails` | APIで作者名・コミットメッセージを補うか | `true` |
| `commitMessageMaxLength` | コミットメッセージの最大文字数 | `100` |
| `notifyErrorsToDiscord` | エラーをDiscordへ送るか | `true` |

`fetchCommitDetails` を `false` にすると，
「どのブランチが更新されたか」だけの通知になります．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 実行できる関数

Apps Scriptの「実行する関数」から選べます．

| 関数名 | 内容 |
| --- | --- |
| `step1_make_token` | 合言葉を発行する（設定済みならその旨を知らせる） |
| `step1_remake_token` | 合言葉を作り直す．Hugging Face側の登録もやり直しになる |
| `step2_show_webhook_url` | Hugging Faceに登録するURLを表示する |
| `save_access_token` | HFアクセストークンをスクリプト プロパティへ保存する |
| `delete_access_token` | 保存したHFアクセストークンを削除する |
| `test_send_discord_message` | Discordへ固定の文面を送り，接続を確認する |
| `test_huggingface_payload` | サンプルデータで実際の文面を確認する |

### doPost について

`doPost` も一覧に表示されますが，**手動で実行しないでください．**

これはHugging Faceから知らせが届いたときに，GASが自動で呼び出す入口です．
手動で実行すると，合言葉が付いていない状態で動くため，
実行ログに「token がありません。破棄します。」と出て何も起きません．
エラーにはならず，Discordへも送信されません．

| 関数 | 呼び出す人 |
| --- | --- |
| `doPost` | Hugging Face（自動） |
| それ以外 | 自分（手動） |

末尾が `_` の関数（`processHuggingFacePayload_` など）は内部用のため，
一覧には表示されません．

### 設定の手順

`step1` と `step2` は，**間にデプロイを挟むため2つに分かれています**．

| 順番 | 関数 | すること |
| --- | --- | --- |
| 1 | `step1_make_token` | 合言葉を発行し，`config_huggingface.js` に貼る |
| 2 | （手作業） | デプロイし，**ウェブアプリURLをコピーする** |
| 3 | （手作業） | `config_huggingface.js` の `webAppUrl` に貼る |
| 4 | `step2_show_webhook_url` | Hugging Faceに登録するURLが表示される |

`step1_make_token` は，すでに合言葉が設定されている場合は作り直しません．
作り直したいときだけ `step1_remake_token` を使ってください．
作り直すと，Hugging Face側に登録したURLも無効になります．

> **なぜURLを手で貼るのか**
> Apps Scriptの `getUrl()` は，エディタから実行すると
> **開発用（`/dev`）のURLや，古いデプロイのURLを返す**ことがあります．
> そのURLを登録すると，Hugging Faceから呼び出しても届きません．
>
> デプロイ画面に表示されたURLを `webAppUrl` に貼ることで，
> 確実に正しいURLを登録できます．
>
> `?token=…` まで含めて貼ってしまっても，自動で取り除きます．

### 確認する順番

うまく動かないときは，次の順に試すと原因を切り分けられます．

1. `test_send_discord_message` — Discordへ届くか
2. `test_huggingface_payload` — 文面が正しく作られるか
3. `step2_show_webhook_url` — 登録したURLと一致しているか

`test_huggingface_payload` は，実行するたびに処理済みの記録を消すため，
何度でも同じ内容を試せます．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ファイル構成

```text
.
├── README.md
├── .clasp.json
└── gas
    ├── appsscript.json          マニフェスト（実行権限とタイムゾーン）
    ├── config_huggingface.js    設定ファイル．ここだけ書き換える
    ├── main.js                  入口．doPost と確認用の関数
    ├── webhook_verify.js        合言葉の照合
    ├── payload_parser.js        届いたデータの読み取りと絞り込み
    ├── hf_api.js                作者名・コミットメッセージの取得
    ├── message_builders.js      Discordへ送る本文の組み立て
    ├── send_discord.js          Discordへの送信
    ├── event_store.js           二重通知の防止
    ├── settings_resolver.js     設定値の検証
    ├── utils.js                 小さな共通関数
    └── sample_data.js           動作確認用のサンプルデータ
```

通常，書き換えるのは `config_huggingface.js` だけです．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## Git管理上の注意

`gas/config_huggingface.js` には**Discord Webhook URLと合言葉が入る**ため，
`.gitignore` でコミットの対象から外しています．

`.clasp.json` は，プレースホルダの状態でリポジトリに含めています．
自分のスクリプトIDを書き込んだあとは，次のコマンドで変更が追跡されないようにしてください．

```sh
git update-index --skip-worktree .clasp.json
```

> **注意**
> Discord Webhook URLを知っている人は，そのチャンネルへメッセージを送信できます．
> URLを他人に共有したり，公開リポジトリに載せたりしないでください．
> 誤って公開した場合は，Discord側でそのウェブフックを削除して作り直してください．

Hugging Faceのアクセストークンは，設定ファイルではなく
スクリプト プロパティに保存するため，コミットされることはありません．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## うまくいかないとき

まず，Hugging Faceの [Webhooks設定](https://huggingface.co/settings/webhooks) にある
**Activity** タブを確認してください．送信されたデータとHTTPステータスが表示されます．

| 症状 | 確認すること |
| --- | --- |
| 通知がまったく来ない | Activityタブに記録があるか．無ければHugging Face側の登録を確認する |
| `Everything up-to-date` と出てpushできない | コミットができていない．`git status` で確認し，`git commit -m "説明"` を実行する |
| `git commit` でエラーになる | コマンドの打ち間違いが多い．`commit` の後にハイフンは付かない |
| `last trigger: never` のまま | 登録したURLが古いデプロイを指している可能性がある．`step2_show_webhook_url` の出力と，Hugging Faceに登録済みのURLを見比べる |
| Activityに記録はあるが通知が来ない | URLの `?token=` と `webhookToken` が一致しているか |
| `401` や `403` になる | デプロイの「アクセスできるユーザー」が**全員**になっているか |
| 作者名が出ない | privateリポジトリなら `HF_ACCESS_TOKEN` を設定する |
| コミットメッセージが出ない | 同上．`fetchCommitDetails` が `true` か |
| 同じ通知が2回来る | 通常は起きない．Hugging Face側の再送は自動で除かれる |
| Pull Requestが通知されない | `notifyPullRequestRefs` が `false` になっていないか |
| Webhookが止まった | 配信が続けて失敗すると自動で停止する．設定画面から再開する |

Webhookには**24時間あたり1,000回**の上限があります．
通常の使い方で超えることはありません．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 関連資料

- [Hugging Face Webhooks（公式ドキュメント）](https://huggingface.co/docs/hub/webhooks)
- [Hugging Face Access Tokens](https://huggingface.co/settings/tokens)
- [Google Apps Script 公式ドキュメント](https://developers.google.com/apps-script)
- [Apps Script のウェブアプリ](https://developers.google.com/apps-script/guides/web)
- [Discord — Webhookの使い方（公式ヘルプ）](https://support.discord.com/hc/ja/articles/228383668)
- [clasp - GitHub](https://github.com/google/clasp)

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 作成者

| 項目 | 内容 |
| --- | --- |
| 作成者 | kurokara-YK |
| 連絡先 | kurokara1226@gmail.com |
| リンク集 | https://lit.link/kurokara |

不具合の報告や改善の提案は，Issues または上記のメールアドレスまでお願いします．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ライセンス

このリポジトリのコードは自由に利用・改変してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>
