<a name="readme-top"></a>

# 英語学習 Discord BOT

Googleスプレッドシートに書いた英文を，決まった時間にDiscordへ自動で送るBOTです．

Googleアカウントがあれば無料で使えます．

<details>
  <summary>目次</summary>
  <ol>
    <li><a href="#どんなものか">どんなものか</a></li>
    <li><a href="#届くメッセージ">届くメッセージ</a></li>
    <li><a href="#ドキュメント一覧">ドキュメント一覧</a></li>
    <li><a href="#使いはじめる">使いはじめる</a></li>
    <li><a href="#しくみ">しくみ</a></li>
    <li><a href="#スプレッドシートの形式">スプレッドシートの形式</a></li>
    <li><a href="#メッセージの構成">メッセージの構成</a></li>
    <li><a href="#送信順序と停止条件">送信順序と停止条件</a></li>
    <li><a href="#送信する時間と頻度">送信する時間と頻度</a></li>
    <li><a href="#設定項目一覧">設定項目一覧</a></li>
    <li><a href="#実行できる関数">実行できる関数</a></li>
    <li><a href="#ファイル構成">ファイル構成</a></li>
    <li><a href="#著作権について">著作権について</a></li>
    <li><a href="#関連資料">関連資料</a></li>
    <li><a href="#作成者">作成者</a></li>
    <li><a href="#ライセンス">ライセンス</a></li>
  </ol>
</details>

## どんなものか

覚えたい英文をスプレッドシートに1行ずつ書いておくと，
このBOTが決まった時間にDiscordへ1文ずつ送ってくれます．

- 英文・日本語訳・意味のまとまり（チャンク）をまとめて見返せる
- 英語チャンクと日本語チャンクが同じ並び順で表示されるので，語順のまま理解しやすい
- 英語部分はGoogle翻訳へのリンクになっており，タップすると本文が入力済みで開く
- 番号順に送るか，ランダムに送るかを選べる
- 送信する時間帯・頻度・1回の文数はすべて設定で変えられる

**このリポジトリに例文データは含まれていません．** 学習データは利用者が自分で用意します．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 届くメッセージ

Discordには次のようなメッセージが届きます．**1文につき1メッセージ**です．

```text
【英語復習 No.1】
The meeting was postponed until next Friday.

会議は来週の金曜日まで延期された。

The meeting ｜ was postponed ｜ until next Friday
会議は ｜ 延期された ｜ 来週の金曜日まで

🔊 全文を聞く

English Learning Sheet
```

英語チャンク（4行目）と全文リンク（6行目）は，それぞれGoogle翻訳へのリンクになっています．
日本語訳・日本語チャンク・区切り記号はリンクにならないため，見た目が崩れません．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ドキュメント一覧

目的に応じて，次のドキュメントを読んでください．

| ドキュメント | 読むタイミング | 内容 |
| --- | --- | --- |
| **[docs/getting_started.md](docs/getting_started.md)** | **まずここから** | セットアップ手順．WebhookとスプレッドシートのURL取得から自動送信の設定まで，画面操作の順に説明しています |
| [docs/chunking_rules.md](docs/chunking_rules.md) | 学習データを作るとき | 英文をどこで区切るかの基準．同じ基準で作らないと粒度がばらつくため，データを増やす前に読んでください |
| [docs/development_environment.md](docs/development_environment.md) | コードを編集したいとき | claspを使い，パソコン上のエディタでコードを編集するための環境構築手順．BOTを動かすだけなら不要です |

このREADMEは，**機能と設定項目のリファレンス**です．
セットアップの実際の操作手順は [docs/getting_started.md](docs/getting_started.md) にあります．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 使いはじめる

セットアップの手順は **[docs/getting_started.md](docs/getting_started.md)** にまとめています．

はじめての人でも進められるよう，画面の操作から順に説明しています．所要時間はおよそ30〜60分です．

| ドキュメント | 内容 |
| --- | --- |
| [はじめかた](docs/getting_started.md) | セットアップ手順．**まずここから** |
| [チャンク分割ルール](docs/chunking_rules.md) | 英文をどこで区切るかの基準 |
| [開発環境の準備](docs/development_environment.md) | パソコン上でコードを編集したい人向け（clasp） |

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## しくみ

```text
Googleスプレッドシート   … 英文データを書いておく表
        ↓
Google Apps Script      … 決まった時間に表を読んでDiscordへ送るプログラム
        ↓
Discord Webhook         … メッセージが届く場所
```

**Google Apps Script（GAS）** は，Googleが無料で提供している
「Googleのサーバー上でプログラムを動かす仕組み」です．
自分のパソコンを起動していなくても，Googleのサーバーが決まった時間に自動で動かしてくれます．

**Webhook（ウェブフック）** は，外部のプログラムからDiscordのチャンネルへ
メッセージを投稿するための専用の投稿口です．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## スプレッドシートの形式

学習データは，5列のスプレッドシートで管理します．
自分で列を作る必要はありません．次のどちらかを実行すると，書式ごと作られます．

| 関数名 | 作られるもの |
| --- | --- |
| `create_english_learning_spreadsheet_template_with_sample` | 見出し + **記入例10文**（はじめて使うときはこちら） |
| `create_english_learning_spreadsheet_template` | 見出しのみの空シート |

`templateFolderId` で指定したGoogleドライブのフォルダに，
`sentenceSheetName`（既定 `sentences`）という名前のシートを持つファイルが作られ，
実行ログに作成先の `spreadsheetId` とURLが出ます．

罫線と中央揃えは1000行目まで先に適用済みなので，行を追加しても書式を整える必要はありません．

実行するとどのようなシートになるかは，
**[docs/English Learning Sheet_template.xlsx](docs/English%20Learning%20Sheet_template.xlsx)**
でも確認できます．

| No. | 英文 | 日本語訳 | 英語チャンク | 日本語チャンク |
| --- | --- | --- | --- | --- |
| 1 | The meeting was postponed until next Friday. | 会議は来週の金曜日まで延期された。 | The meeting｜was postponed｜until next Friday | 会議は｜延期された｜来週の金曜日まで |
| 2 | She asked me to send the file again. | 彼女は私にそのファイルをもう一度送るよう頼んだ。 | She asked me｜to send the file｜again | 彼女は私に頼んだ｜そのファイルを送るよう｜もう一度 |

- **No.** は1から順の通し番号で，この順番で送信されます
- **英語チャンク** と **日本語チャンク** は `｜`（全角の縦棒）で区切ります
- 英語チャンクと日本語チャンクは，**同じ個数・同じ並び順**にします

### なぜ「チャンク分割ルール」が必要なのか

英文をどこで区切るかは，人によっても，作る日によっても変わってしまいます．
基準を決めずにデータを増やすと，次の問題が起きます．

- **粒度がばらつく** — ある文は細かく，ある文は大きく区切られ，復習のリズムが崩れる
- **あとからそろえ直せない** — 100文たまってから基準を変えると，全部作り直しになる
- **短すぎるチャンクはタップできない** — `We` のような2文字のリンクはスマートフォンで押せない
- **日本語チャンクの個数が合わない** — 英語と個数が違うと，上下の対応が取れず読めなくなる

そのため，このリポジトリでは区切り方の基準を
**[docs/chunking_rules.md](docs/chunking_rules.md)** に明文化しています．
**学習データを増やす前に，一度目を通してください．**

### AIにデータを作ってもらう

チャンク分割を1文ずつ手作業で行うのは大変です．
ChatGPT・Claude・GeminiなどのAIに，このルールを渡して作ってもらうと効率よく用意できます．

**手順**

1. [docs/chunking_rules.md](docs/chunking_rules.md) を開き，**中身をすべてコピー**します
2. AIのチャットに貼り付け，続けて次のように依頼します

    ```text
    上のルールに従って，英文をチャンク分割してください。

    出力は次の5列を，タブ区切りで1行1文にしてください。
    見出し行は付けず，説明文も付けないでください。

    No.  英文  日本語訳  英語チャンク  日本語チャンク

    英語チャンクと日本語チャンクは全角の縦棒「｜」で区切り，
    同じ個数・同じ並び順にしてください。

    対象の英文は次のとおりです。
    （ここに英文を貼り付ける）
    ```

3. AIが出力した内容を**そのままコピー**します
4. スプレッドシートの **2行目のA列**（記入例がある場合はその下の行）を選び，
   **貼り付け**ます

タブ区切りで出力してもらうと，貼り付けたときに5つの列へ自動で分かれます．
1つのセルにまとまってしまう場合は，AIに「タブ区切りで出力して」ともう一度伝えてください．

> **貼り付けたあとに必ず確認してください**
> AIの出力は完璧ではありません．次の2点は目視で確認することをおすすめします．
>
> - 英語チャンクと日本語チャンクの**個数が同じ**か
> - `We` のような**極端に短いチャンク**が単独になっていないか
>
> 判断に迷ったら [docs/chunking_rules.md](docs/chunking_rules.md) の「よくある失敗」を参照してください．

> **著作権についての注意**
> 市販の教材の例文をAIに渡して作成したデータは，**個人の学習用に留めてください．**
> 例文・訳を含むスプレッドシートを，共有リンクを含めて公開しないでください．

上の2文は，このREADMEのために書き下ろしたオリジナル文です．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## メッセージの構成

本文は上から順に次のとおりです．

| 行 | 内容 | リンク |
| --- | --- | --- |
| 1 | `【` + `messageTitlePrefix` + ` No.` + 番号 + `】` | — |
| 2 | 英文 | — |
| 3 | 日本語訳 | — |
| 4 | 英語チャンク行．区切りは `｜` | **各チャンクが個別のGoogle翻訳リンク** |
| 5 | 日本語チャンク行．英語チャンクと同じ並び順 | — |
| 6 | `sentenceLinkLabel`（既定 `🔊 全文を聞く`） | 全文のGoogle翻訳リンク |
| 7 | スプレッドシート名 | 学習データシートへのリンク |

リンクには，本文を `text` パラメータに載せたGoogle翻訳のURLを埋め込んでいます．

```text
https://translate.google.com/?sl=en&tl=ja&op=translate&text=<URLエンコードした本文>
```

そのため，リンクを開いた時点で翻訳画面に本文が入力済みになります．コピーと貼り付けは不要です．

翻訳元・翻訳先の言語は `translateSourceLang` / `translateTargetLang` で変更できます（既定は `en` / `ja`）．
リンク自体が不要な場合は `chunkLinkEnabled` / `sentenceLinkEnabled` を `false` にしてください．

### 文字数と送信間隔

チャンクリンクは1チャンクあたり約100文字を本文に足すため，1文あたりの本文はおよそ1,100文字になります．
1文1メッセージなので通常は `discordMessageMaxLength` に収まりますが，
極端に長い文で上限を超えた場合は**その文だけ送信を見送り**，ログに記録して残りの送信を続けます．

連続送信はDiscordのレート制限に掛かるため，2件目以降は `sendIntervalMs`（既定1000ミリ秒）だけ待ってから送信します．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 送信順序と停止条件

`sendMode: "sequential"`（既定）では，No.の小さい順に送ります．

```text
1回目 → No.1
2回目 → No.2
3回目 → No.3
   ...
最終行まで送信 → 以降は何も送らない（停止）
```

次回に送る番号はScript Propertiesに保存されるため，
トリガーで自動実行しても順番が続きます．

**最終行まで送り切ると先頭には戻らず停止します．** ログには次のように出ます．

```text
最後の文まで送信済みのため停止します。先頭から送り直すには reset_english_learning_progress を実行してください。
```

先頭から送り直すには `reset_english_learning_progress` を実行してください．

`batchSize` を2以上にした場合，最終行付近では残り件数だけを送って停止します．
たとえば全5文で `batchSize: 3` なら，1回目にNo.1〜3，2回目にNo.4〜5を送り，3回目以降は停止します．

`sendMode: "random"` を選ぶと，毎回ランダムに選ばれます．この場合は停止しません．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 送信する時間と頻度

送信タイミングは，**2つの設定の組み合わせ**で決まります．

| 決めるもの | 場所 |
| --- | --- |
| どれくらいの間隔で実行するか | Apps Scriptの **トリガー** |
| そのうちどの時間帯に実際に送るか | `config_english.js` の `allowedTimeRanges` |

トリガーは，Apps Scriptの左メニュー **トリガー** から
`english_learning_main` に対して時間主導型トリガーを追加します．
**間隔は `1分おき` から `12時間おき` まで自由に選べます．**
「毎日決まった時刻に1回だけ」にしたい場合は `日付ベースのタイマー` を選んで時刻を指定してください．

`allowedTimeRanges` は，送信を許可する時間帯の一覧です．
`startHour` 以上 `endHour` 未満で判定します．

```js
// 朝7時台と夜21時台だけ送る
allowedTimeRanges: [
  { startHour: 7, endHour: 8 },
  { startHour: 21, endHour: 22 }
]

// 時間帯を制限せず，いつでも送る
allowedTimeRanges: [
  { startHour: 0, endHour: 24 }
]
```

ひな形の初期状態は「1時間おきのトリガー ＋ 9:00〜24:00 のみ送信」ですが，
これは一例です．**自分の生活リズムに合わせて自由に書き換えてください．**

1回の実行で送る文数は `batchSize` で変えられます（既定 `1`）．
大きくする場合は，GASの1回あたりの実行時間上限（6分）に収まるか注意してください．

設定の詳しい手順は [docs/getting_started.md](docs/getting_started.md) の「手順8」を参照してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 設定項目一覧

設定は `gas/config_english.js` にまとめています．

リポジトリにはプレースホルダ（`ここに〜を入れてください`）が入った状態で含まれています．
このファイルを開き，下表の項目を自分の値へ書き換えてください．
Apps Script側での作り方は
[docs/getting_started.md](docs/getting_started.md) の「手順4」で説明しています．

> **⚠️ コミット前に必ず確認してください**
> `gas/config_english.js` には，あなたのWebhook URLが入ります．
> **このファイルは `.gitignore` に含まれていないため，`git add -A` などで
> 意図せずコミットされる可能性があります．**
>
> 自分の値を入れたあとGitHubへ push する場合は，次のいずれかを行ってください．
>
> ```bash
> # 方法1: 手元の変更をコミット対象から外す（推奨）
> git update-index --skip-worktree gas/config_english.js
>
> # 方法2: .gitignore に戻す
> echo "gas/config_english.js" >> .gitignore
> git rm --cached gas/config_english.js
> ```
>
> Webhook URLを公開してしまった場合は，**Discord側でそのウェブフックを削除して作り直してください．**
> 削除するまで，URLを知っている人は誰でもそのチャンネルへ投稿できます．

| 項目 | 内容 | 既定値 |
| --- | --- | --- |
| `label` | ログに出す表示名 | `英語学習 Discord BOT` |
| `webhookUrl` | Discord Webhook URL | （要設定） |
| `spreadsheetId` | 読み取る学習用スプレッドシートのIDまたはURL | （要設定） |
| `templateFolderId` | テンプレートを作成するGoogleドライブのフォルダIDまたはURL | （要設定） |
| `templateFileName` | 作成するスプレッドシート名 | `English Learning Sheet` |
| `sentenceSheetName` | 学習データシート名 | `sentences` |
| `batchSize` | 1回の実行で送る文数（1文＝1メッセージ） | `1` |
| `startNumber` | 送信開始番号 | `1` |
| `sendMode` | `sequential`（No.順）または `random` | `sequential` |
| `allowedTimeRanges` | 送信を許可する時間帯の配列 | 9:00〜24:00 |
| `sendIntervalMs` | 連続送信時の待ち時間（ミリ秒） | `1000` |
| `chunkLinkEnabled` | 英語チャンクを個別のGoogle翻訳リンクにするか | `true` |
| `sentenceLinkEnabled` | 全文のGoogle翻訳リンクを付けるか | `true` |
| `sentenceLinkLabel` | 全文リンクの表示名 | `🔊 全文を聞く` |
| `translateSourceLang` | Google翻訳の翻訳元言語コード | `en` |
| `translateTargetLang` | Google翻訳の翻訳先言語コード | `ja` |
| `messageTitlePrefix` | メッセージ先頭のラベル | `英語復習` |
| `discordMessageMaxLength` | 1メッセージあたりの安全な最大文字数 | `1800` |

`webhookUrl`・`spreadsheetId`・`templateFolderId` の3つは，
値を入れるまで「ここに〜を入れてください」という状態になっています．
書き換えないまま実行すると，どの項目が未設定かを知らせるエラーが出ます．

```text
test_send_discord_message: Discord Webhook URL が未設定です。
config_english.js の webhookUrl に，https:// から始まる Webhook URL を設定してください。
```

> **注意**
> `config_english.js` を **`ENGLISH_LEARNING_SETTINGS` という名前で二重に定義しないでください．**
> GASは `gas/` 配下の `.js` を1つのスコープへまとめて読み込むため，
> 同じ名前の定義が2つあると次のエラーになります．
>
> ```text
> SyntaxError: Identifier 'ENGLISH_LEARNING_SETTINGS' has already been declared
> ```

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 実行できる関数

Apps Scriptの画面上部の **実行する関数** から選んで実行します．

| 関数名 | 用途 |
| --- | --- |
| `english_learning_main` | 本番の送信を実行する．**トリガーにはこれを設定する** |
| `create_english_learning_spreadsheet_template_with_sample` | 記入例10文つきの学習シートを新規作成する |
| `create_english_learning_spreadsheet_template` | 見出しのみの空の学習シートを新規作成する |
| `test_send_discord_message` | Discord Webhookの接続確認用に固定文を送る |
| `reset_english_learning_progress` | 順番送信の進捗を初期化し，先頭から送り直せるようにする |

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ファイル構成

<details>
  <summary>ファイル構成と役割</summary>

```text
.
├── README.md
├── .gitignore
├── docs
│   ├── getting_started.md
│   ├── chunking_rules.md
│   ├── development_environment.md
│   └── English Learning Sheet_template.xlsx
└── gas
    ├── appsscript.json
    ├── config_english.js
    ├── main.js
    ├── message_builders.js
    ├── sample_data.js
    ├── send_discord.js
    ├── settings_resolver.js
    ├── spreadsheet_reader.js
    ├── spreadsheet_template.js
    ├── state_store.js
    └── utils.js
```

| ファイル | 役割 |
| --- | --- |
| `README.md` | 機能・仕様・設定項目のリファレンス |
| `docs/getting_started.md` | セットアップ手順 |
| `docs/chunking_rules.md` | チャンク分割の基準 |
| `docs/development_environment.md` | clasp を使った開発環境の準備手順 |
| `docs/English Learning Sheet_template.xlsx` | 記入例つき学習シートの見本 |
| `gas/appsscript.json` | GASプロジェクトのタイムゾーンやOAuthスコープを定義する |
| `gas/config_english.js` | 設定ファイル．**自分の値を書き込んで使う** |
| `gas/main.js` | Apps Scriptから実行する入口関数をまとめる |
| `gas/message_builders.js` | 送信対象の文を選び，Discordへ送る本文へ整形する |
| `gas/sample_data.js` | テンプレートへ書き込む記入例10文を持つ |
| `gas/send_discord.js` | Discord WebhookへのPOSTを行う |
| `gas/settings_resolver.js` | 設定値を検証し，既定値を補って実行用設定へ整える |
| `gas/spreadsheet_reader.js` | 学習用スプレッドシートから英文データを読み出す |
| `gas/spreadsheet_template.js` | 学習シートを新規作成し，見出しと書式を整える |
| `gas/state_store.js` | 順番送信の次回開始番号をScript Propertiesに保存する |
| `gas/utils.js` | 値の正規化・リンク生成などの共通関数をまとめる |

関数名の末尾に `_` が付くものは内部用で，
Apps Scriptの「実行する関数」の一覧には表示されません．

`gas/config_english.js` はプレースホルダの状態でリポジトリに含まれています．
clone後にこのファイルを開き，自分の値へ書き換えて使ってください．

</details>

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 著作権について

このBOTは例文データを含みません．**学習データは利用者が自分で用意します．**

市販の学習書などからデータを作る場合は，次を守ってください．

- 例文・訳を含むスプレッドシートを公開しない（共有リンクも貼らない）
- 作成したデータは個人の学習用に留める

`.gitignore` では `gas/config_english.js` と `.clasp.json` を除外しています．
これらには Webhook URL やプロジェクトIDなど個人の情報が入るため，公開しないでください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 関連資料

- [Google 翻訳](https://translate.google.com/) — メッセージ内のリンク先
- [Google Apps Script 公式ドキュメント](https://developers.google.com/apps-script)
- [Apps Script のトリガー](https://developers.google.com/apps-script/guides/triggers/installable)
- [Discord — Webhookの使い方（公式ヘルプ）](https://support.discord.com/hc/ja/articles/228383668)
- [clasp - GitHub](https://github.com/google/clasp)

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 作成者

| 項目 | 内容 |
| --- | --- |
| 作成者 | kurokara-YK |
| 連絡先 | kurokara1226@gmail.com |
| リポジトリ | https://github.com/kurokara-YK/daily_learning_discord_bot |

不具合の報告や改善の提案は，
[Issues](https://github.com/kurokara-YK/daily_learning_discord_bot/issues)
または上記のメールアドレスまでお願いします．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ライセンス

このリポジトリのコードは自由に利用・改変してください．
利用者が用意する学習データの取り扱いについては，[著作権について](#著作権について)を参照してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>
