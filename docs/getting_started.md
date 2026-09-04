<a name="getting-started-top"></a>

# はじめかた（セットアップ手順）

このBOTを自分のDiscordサーバーで動かすまでの手順です．

**プログラミングの経験は必要ありません．** 画面の指示どおりにコピー＆ペーストしていけば動きます．
所要時間は，はじめての人でおよそ30〜60分です．

<details>
  <summary>目次</summary>
  <ol>
    <li><a href="#はじめに知っておくこと">はじめに知っておくこと</a></li>
    <li><a href="#用意するもの">用意するもの</a></li>
    <li><a href="#手順1-discord-の-webhook-url-を取得する">手順1. Discord の Webhook URL を取得する</a></li>
    <li><a href="#手順2-スプレッドシートを作る">手順2. スプレッドシートを作る</a></li>
    <li><a href="#手順3-apps-script-にコードを貼り付ける">手順3. Apps Script にコードを貼り付ける</a></li>
    <li><a href="#手順4-設定ファイルを作る">手順4. 設定ファイルを作る</a></li>
    <li><a href="#手順5-discord-への送信をテストする">手順5. Discord への送信をテストする</a></li>
    <li><a href="#手順6-学習データを入力する">手順6. 学習データを入力する</a></li>
    <li><a href="#手順7-手動で送信してみる">手順7. 手動で送信してみる</a></li>
    <li><a href="#手順8-自動送信の設定をする">手順8. 自動送信の設定をする</a></li>
    <li><a href="#日々の使い方">日々の使い方</a></li>
    <li><a href="#うまくいかないとき">うまくいかないとき</a></li>
  </ol>
</details>

## はじめに知っておくこと

このBOTは，次の3つを組み合わせて動きます．

```text
Googleスプレッドシート   … 英文データを書いておく表
        ↓
Google Apps Script      … 決まった時間に表を読んでDiscordへ送るプログラム
        ↓
Discord                 … メッセージが届く場所
```

**Google Apps Script（GAS）** は，Googleが無料で提供している「Googleのサーバー上でプログラムを動かす仕組み」です．
自分のパソコンを起動していなくても，Googleのサーバーが決まった時間に自動で動かしてくれます．

必要なのはGoogleアカウントとDiscordアカウントだけで，**費用はかかりません．**

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 用意するもの

| 必要なもの | 用途 |
| --- | --- |
| Googleアカウント | スプレッドシートとApps Scriptを使うため |
| Discordアカウント | メッセージの受け取り先 |
| 自分が管理者のDiscordサーバー | Webhookを作るには管理権限が必要 |

自分のサーバーがない場合は，Discordの左側にある `+` ボタンから
「オリジナルの作成」を選ぶと，自分専用のサーバーを無料で作れます．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 手順1. Discord の Webhook URL を取得する

**Webhook（ウェブフック）** とは，「外部のプログラムからDiscordのチャンネルへメッセージを投稿するための，専用の投稿口」です．
このURLさえあれば，BOTのアカウントを作らなくてもメッセージを送れます．

1. Discordで，メッセージを受け取りたいチャンネルにマウスを乗せます
2. チャンネル名の右にある **歯車アイコン（チャンネルの編集）** をクリックします
3. 左のメニューから **連携サービス** を選びます
4. **ウェブフック** → **新しいウェブフック** をクリックします
5. **ウェブフックURLをコピー** をクリックします

コピーしたURLは次のような形をしています．

```text
https://discord.com/api/webhooks/000000000000000000/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

このURLは，あとの手順4で使うので，メモ帳などに一時的に貼り付けておいてください．

> **重要**
> このURLを知っている人は誰でもあなたのチャンネルへ投稿できます．
> **SNSやGitHubなど，人から見える場所には絶対に貼らないでください．**
> もし公開してしまった場合は，同じ画面で **ウェブフックを削除** して作り直してください．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 手順2. スプレッドシートを作る

英文データを書き込む表を用意します．

1. ブラウザで [Googleスプレッドシート](https://docs.google.com/spreadsheets/) を開きます
2. **空白のスプレッドシート** をクリックして新規作成します
3. 左上のファイル名（`無題のスプレッドシート`）をクリックし，好きな名前を付けます

    ```text
    例: English Learning Sheet
    ```

この時点では中身は空のままで構いません．
学習データを書き込む表は，あとで手順6でプログラムが自動で作ってくれます．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 手順3. Apps Script にコードを貼り付ける

1. 手順2で作ったスプレッドシートで，上のメニューから
   **拡張機能** → **Apps Script** をクリックします

2. 新しいタブでApps Scriptのエディタが開きます．
   最初から `コード.gs` というファイルがあり，中に次のような数行が書かれています．

    ```js
    function myFunction() {
    }
    ```

    この中身はすべて消してください．

3. 左側の **ファイル** の横にある `+` → **スクリプト** をクリックして，
   このリポジトリの `gas/` フォルダにあるファイルと同じ数だけファイルを作り，
   それぞれの中身をコピーして貼り付けます．

    | Apps Script側のファイル名 | 貼り付ける中身 |
    | --- | --- |
    | `main` | `gas/main.js` |
    | `message_builders` | `gas/message_builders.js` |
    | `sample_data` | `gas/sample_data.js` |
    | `send_discord` | `gas/send_discord.js` |
    | `settings_resolver` | `gas/settings_resolver.js` |
    | `spreadsheet_reader` | `gas/spreadsheet_reader.js` |
    | `spreadsheet_template` | `gas/spreadsheet_template.js` |
    | `state_store` | `gas/state_store.js` |
    | `utils` | `gas/utils.js` |
    | `config_english` | 手順4で作ります（まだ空でOK） |

    ファイル名の `.gs` は自動で付くので，入力するのは `main` のように拡張子なしの部分だけです．


4. 上部の **プロジェクトを保存**（フロッピーディスクのアイコン）をクリックします

> **補足**
> パソコン上のエディタでまとめて編集したい人は，`clasp` という道具を使うと
> コピー＆ペーストせずに済みます．手順は [開発環境の準備](development_environment.md) を参照してください．
> はじめての人は，まずこのページのコピー＆ペーストで進めることをおすすめします．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 手順4. 設定ファイルを作る

Webhook URLやスプレッドシートIDなど，**あなた専用の値**を書き込むファイルを作ります．

1. Apps Scriptで `config_english` という名前のファイルを作ります（手順3で作っていればそのまま使います）

2. 下の「設定ファイルの中身」をすべてコピーし，`config_english` に貼り付けます

3. 貼り付けた内容のうち，次の項目を自分の値に書き換えます

    | 項目 | 書き込む値 |
    | --- | --- |
    | `webhookUrl` | 手順1でコピーしたWebhook URL |
    | `spreadsheetId` | 手順2で作ったスプレッドシートのURL |
    | `templateFolderId` | スプレッドシートを作るGoogleドライブのフォルダのURL |
    | `templateFileName` | 作られるスプレッドシートの名前（好きな名前でOK） |

    どれも，ブラウザでその画面を開いたときの
    **アドレスバーのURLをそのままコピーして貼り付ければ大丈夫です．**

    ```text
    例: https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
    ```

4. **プロジェクトを保存** をクリックします

### 設定ファイルの中身

次の内容をすべてコピーして，`config_english` に貼り付けてください．
`ここに〜を入れてください` と書かれた3か所を，自分の値に書き換えます．

```js
/****************************************************
 * config_english.gs
 * ==================================================
 * 英語学習 Discord BOT の設定ファイル
 *
 * 「ここに入れてください」と書かれた項目に，
 * 自分の値を書き込んでから使うこと。
 *
 * 【注意】
 *   このファイルには Webhook URL などの自分だけの値が入る。
 *   他人に見せたり，どこかへ貼り付けたりしないこと。
 *
 *   このファイルは .gitignore に含まれていないため，
 *   git add -A などで意図せずコミットされる可能性がある。
 *   GitHub などへ公開する前に，値が残っていないか必ず確認すること。
 *
 *   誤って Webhook URL を公開してしまった場合は，
 *   Discord 側でそのウェブフックを削除し，作り直すこと。
 ****************************************************/

const ENGLISH_LEARNING_SETTINGS = {
  // 実行ログに出す表示名。好きな名前でよい。
  label: "英語学習 Discord BOT",

  // Discord Webhook URL。
  // Discord のチャンネル設定 → 連携サービス → ウェブフック から
  // 「ウェブフックURLをコピー」で取得した URL を貼り付ける。
  // このURLを知っている人は誰でも投稿できるため，他人に見せないこと。
  webhookUrl: "ここにDiscordのWebhook URLを入れてください",

  // english_learning_main が読み取りに使うスプレッドシート。
  // 学習データのスプレッドシートを開いたときの，アドレスバーのURLをそのまま貼り付ける。
  // create_english_learning_spreadsheet_template_with_sample を実行すると
  // 実行ログにURLが出るので，その値を貼り付けてもよい。
  spreadsheetId: "ここに学習データのスプレッドシートのURLを入れてください",

  // テンプレート作成先の Google ドライブのフォルダ。
  // Google ドライブでフォルダを開いたときの，アドレスバーのURLをそのまま貼り付ける。
  templateFolderId: "ここに作成先のGoogleドライブのフォルダのURLを入れてください",

  // テンプレート作成時のスプレッドシート名。
  // create_english_learning_spreadsheet_template
  // create_english_learning_spreadsheet_template_with_sample
  // で作られるファイルの名前になる。
  templateFileName: "English Learning Sheet",

  // 送信に使う学習データシート名。
  // スプレッドシート下部のタブに表示されている名前と一致させること。
  sentenceSheetName: "sentences",

  // 1回の実行で送る文数。1文につき Discord へ 1 メッセージ送信する。
  // 例: 10 にすると 1 回の実行で 10 メッセージ送信される。
  batchSize: 1,

  // 送信対象の開始番号。
  startNumber: 1,

  // sequential: No. の小さい順に送る / random: ランダムに送る
  // sequential では最後の文まで送ると停止し，先頭には戻らない。
  // 先頭から送り直すには reset_english_learning_progress を実行する。
  sendMode: "sequential",

  // 送信を許可する時間帯。startHour 以上 endHour 未満で判定する。
  // 行頭に // を付けるとその時間帯には送信されない。
  // 生活リズムに合わせて自由に書き換えてよい。
  // 例: 時間帯を制限しない場合は [{ startHour: 0, endHour: 24 }] だけにする。
  allowedTimeRanges: [
    // { startHour: 0, endHour: 1 },
    // { startHour: 1, endHour: 2 },
    // { startHour: 2, endHour: 3 },
    // { startHour: 3, endHour: 4 },
    // { startHour: 4, endHour: 5 },
    // { startHour: 5, endHour: 6 },
    // { startHour: 6, endHour: 7 },
    // { startHour: 7, endHour: 8 },
    // { startHour: 8, endHour: 9 },
    { startHour: 9, endHour: 10 },
    { startHour: 10, endHour: 11 },
    { startHour: 11, endHour: 12 },
    { startHour: 12, endHour: 13 },
    { startHour: 13, endHour: 14 },
    { startHour: 14, endHour: 15 },
    { startHour: 15, endHour: 16 },
    { startHour: 16, endHour: 17 },
    { startHour: 17, endHour: 18 },
    { startHour: 18, endHour: 19 },
    { startHour: 19, endHour: 20 },
    { startHour: 20, endHour: 21 },
    { startHour: 21, endHour: 22 },
    { startHour: 22, endHour: 23 },
    { startHour: 23, endHour: 24 }
  ],

  // メッセージを連続送信するときの送信間隔（ミリ秒）。
  // Discord のレート制限を避けるための待ち時間。
  sendIntervalMs: 1000,

  // 英語チャンクを 1 つずつ Google翻訳リンクにするか。
  // true にすると，チャンクをタップした時点で翻訳画面に本文が入力済みになる。
  chunkLinkEnabled: true,

  // 全文ぶんの Google翻訳リンクを本文末尾に付けるか。
  sentenceLinkEnabled: true,

  // 全文リンクの表示名。
  sentenceLinkLabel: "🔊 全文を聞く",

  // Google翻訳の翻訳元／翻訳先の言語コード。
  translateSourceLang: "en",
  translateTargetLang: "ja",

  // Discord 本文の先頭ラベル。
  messageTitlePrefix: "英語復習",

  // Discord の1メッセージあたりの安全な最大文字数。
  discordMessageMaxLength: 1800
};
```

書き換えないまま実行すると，どの項目が未設定かを知らせるエラーが出ます．

```text
test_send_discord_message: Discord Webhook URL が未設定です。
config_english.js の webhookUrl に，https:// から始まる Webhook URL を設定してください。
```

> **⚠️ 重要**
> `config_english.js` には，あなたのWebhook URLとスプレッドシートのURLが入ります．
> **このファイルを人に見せたり，GitHubへアップロードしたりしないでください．**
>
> このファイルは `.gitignore` に含まれていないため，
> `git add -A` などで意図せずコミットされることがあります．
> GitHubへ公開する前に，値が残っていないか必ず確認してください．
> 詳しくは [README](../README.md) の「設定項目一覧」を参照してください．

> **`ENGLISH_LEARNING_SETTINGS` が重複しているというエラーが出たら**
> GASは `gas/` の中のファイルをすべてまとめて読み込みます．
> `ENGLISH_LEARNING_SETTINGS` を書いたファイルが2つあると次のエラーになります．
>
> ```text
> SyntaxError: Identifier 'ENGLISH_LEARNING_SETTINGS' has already been declared
> ```
>
> `config_english` 以外に同じ内容を貼り付けたファイルがないか確認してください．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 手順5. Discord への送信をテストする

まず，Discordへちゃんと届くかだけを確かめます．

1. Apps Scriptの画面上部にある **実行する関数** のリストから
   `test_send_discord_message` を選びます
2. **実行** をクリックします

### はじめて実行するときの許可について

はじめての実行では，Googleから許可を求める画面が出ます．
自分で書いたプログラムを自分のGoogleアカウントで動かすための確認なので，そのまま進めて問題ありません．

1. **権限を確認** をクリックします
2. 自分のGoogleアカウントを選びます
3. 「このアプリはGoogleで確認されていません」と表示されたら，
   **詳細** → **（プロジェクト名）に移動（安全ではないページ）** をクリックします
4. **許可** をクリックします

### 結果を確認する

Discordのチャンネルに次のメッセージが届けば成功です．

```text
【テスト送信】英語学習 Discord BOT からの送信確認です。
```

届かない場合は，[うまくいかないとき](#うまくいかないとき) を確認してください．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 手順6. 学習データを入力する

### 学習データ用のシートを自動で作る

自分で列を作る必要はありません．プログラムが書式ごと作ってくれます．

1. **実行する関数** から `create_english_learning_spreadsheet_template_with_sample` を選びます
2. **実行** をクリックします

`templateFolderId` で指定したフォルダに，**記入例10文が入ったスプレッドシート**が新しく作られます．
はじめて使うときは，この記入例を見ながら書き方を確認できます．

> 記入例が不要で，見出しだけの空のシートがほしい場合は
> `create_english_learning_spreadsheet_template` を実行してください．

3. 画面下の **実行ログ** を確認します．次のように，作成先が表示されます．

    ```text
    テンプレートを作成しました。
      ファイル名   : English Learning Sheet
      シート名     : sentences
      記入例の行数 : 10
      spreadsheetId: 1AbCdEfGhIjKlMnOpQrStUvWxYz
      URL          : https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit
    ```

4. ログの **URL** をクリックすると，作られたスプレッドシートが開きます．
   中身を確認してみてください．

5. ログの **spreadsheetId** をコピーし，
   `config_english` の `spreadsheetId` に貼り付けて保存します

    これで，BOTが「どのスプレッドシートを読むか」が決まります．
    URLをそのまま貼り付けても動きます．

### できあがるシート

次のような5列の表になります．罫線・中央揃えは1000行目まで適用済みなので，
行を足しても書式を整える必要はありません．

| No. | 英文 | 日本語訳 | 英語チャンク | 日本語チャンク |
| --- | --- | --- | --- | --- |
| 1 | The meeting was postponed until next Friday. | 会議は来週の金曜日まで延期された。 | The meeting｜was postponed｜until next Friday | 会議は｜延期された｜来週の金曜日まで |
| 2 | She asked me to send the file again. | 彼女は私にそのファイルをもう一度送るよう頼んだ。 | She asked me｜to send the file｜again | 彼女は私に頼んだ｜そのファイルを送るよう｜もう一度 |
| … | （記入例は10文まで入っています） | | | |

同じものを [English Learning Sheet_template.xlsx](English%20Learning%20Sheet_template.xlsx)
としても置いてあります．実行前に完成形を見たい場合は，このファイルを開いて確認してください．

### 自分のデータを入力する

記入例の下（11行目以降）に，自分の学習データを追加していきます．
記入例が不要になったら，その行を削除して自分のデータに置き換えてください．

- **No.** は1から順の通し番号です．この順番で送信されます
- **英語チャンク** と **日本語チャンク** は，`｜`（全角の縦棒）で区切ります
- 英語チャンクと日本語チャンクは，**同じ個数・同じ並び順**にしてください

### 先にチャンク分割ルールを読んでください

英文をどこで区切るかは，人によっても，作る日によっても変わってしまいます．
基準を決めずにデータを増やすと，あとで次の問題が起きます．

- 粒度がばらつき，復習のリズムが崩れる
- 100文たまってから基準を変えると，全部作り直しになる
- `We` のような短すぎるチャンクは，スマートフォンでタップできない
- 英語と日本語でチャンクの個数が違うと，上下の対応が取れず読めなくなる

そのため区切り方の基準を **[チャンク分割ルール](chunking_rules.md)** にまとめています．
**データを増やす前に，一度目を通してください．**

### AIにデータを作ってもらう

チャンク分割を1文ずつ手作業で行うのは大変です．
ChatGPT・Claude・GeminiなどのAIにルールを渡して作ってもらうと，効率よく用意できます．

1. [チャンク分割ルール](chunking_rules.md) を開き，**中身をすべてコピー**します

2. AIのチャット画面に貼り付け，続けて次のように依頼します

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

4. スプレッドシートに戻り，**データを入れたい行のA列のセル**をクリックして選びます

    記入例が入っている場合は，その下の **A12** セルから始めてください．

5. **貼り付け**ます（`Ctrl` + `V`）

タブ区切りで出力してもらうと，貼り付けたときに5つの列へ自動で分かれます．
すべてが1つのセルにまとまってしまう場合は，
AIに「タブ区切りで出力して」ともう一度伝えてください．

> **貼り付けたあとに必ず確認してください**
> AIの出力は完璧ではありません．次の2点は目で見て確認することをおすすめします．
>
> - 英語チャンクと日本語チャンクの**個数が同じ**か
> - `We` のような**極端に短いチャンク**が単独になっていないか
>
> 判断に迷ったら [チャンク分割ルール](chunking_rules.md) の「よくある失敗」を参照してください．

> **著作権についての注意**
> 市販の教材から作ったデータは，**個人の学習用に留めてください．**
> 例文や訳を含むスプレッドシートを，共有リンクを含めて公開しないでください．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 手順7. 手動で送信してみる

1. **実行する関数** から `english_learning_main` を選びます
2. **実行** をクリックします

Discordに No.1 の英文が届けば成功です．
手順6で記入例つきのシートを作った場合は，記入例の1文目が届きます．

もう一度実行すると No.2 が届きます．このように，実行するたびに次の番号へ進みます．

送信位置を最初（No.1）に戻したいときは，`reset_english_learning_progress` を実行してください．

> **補足**
> 実行しても何も届かない場合は，「今の時刻が送信可能な時間帯に入っていない」可能性があります．
> 実行ログに `現在時刻は送信対象外です。` と出ていれば，これが原因です．
> 送信する時間帯は，次の手順8で自由に変更できます．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 手順8. 自動送信の設定をする

決まった時間に自動で送るには，**トリガー** を設定します．
トリガーとは，「決まったタイミングでこの関数を動かしてください」というGAS側の予約設定です．

### トリガーを追加する

1. Apps Scriptの左メニューから **トリガー**（時計のアイコン）をクリックします
2. 右下の **トリガーを追加** をクリックします
3. 次のように設定します

    | 項目 | 選ぶもの |
    | --- | --- |
    | 実行する関数を選択 | `english_learning_main` |
    | 実行するデプロイを選択 | `Head` |
    | イベントのソースを選択 | `時間主導型` |
    | 時間ベースのトリガーのタイプを選択 | `時間ベースのタイマー` |
    | 時間の間隔を選択 | `1時間おき`（好きな間隔に変えられます） |

4. **保存** をクリックします

### 送信する頻度を変える

**「時間の間隔を選択」の値は，自由に変えて構いません．**

| 選ぶ値 | 動き |
| --- | --- |
| `1分おき` | 1分ごとに送信を試みる |
| `30分おき` | 30分ごとに送信を試みる |
| `1時間おき` | 1時間ごとに送信を試みる |
| `2時間おき`〜`12時間おき` | その間隔ごとに送信を試みる |

「毎日決まった時刻に1回だけ」にしたい場合は，
**時間ベースのトリガーのタイプ** で `日付ベースのタイマー` を選び，時刻を指定します．

### 送信する時間帯を変える

「日中だけ届いてほしい」「夜は通知を止めたい」といった調整は，
`config_english` の `allowedTimeRanges` で行います．

`allowedTimeRanges` に書かれた時間帯だけ送信され，書かれていない時間帯は何も送りません．
判定は `startHour` 以上，`endHour` 未満です．
たとえば `{ startHour: 9, endHour: 10 }` は「9:00以上10:00未満」を意味します．

行頭に `//` を付けるとその行は無効になり（コメントアウトと言います），その時間帯は送信されなくなります．

**例1: 9時から24時まで送る（ひな形の初期状態）**

```js
allowedTimeRanges: [
  // { startHour: 0, endHour: 1 },   ← // が付いているので送らない
  // { startHour: 1, endHour: 2 },
  //  …（8時まで同様）
  { startHour: 9, endHour: 10 },     // ← // が付いていないので送る
  { startHour: 10, endHour: 11 },
  //  …（23時まで同様）
  { startHour: 23, endHour: 24 }
]
```

**例2: 朝7時台と夜21時台だけ送る**

```js
allowedTimeRanges: [
  { startHour: 7, endHour: 8 },
  { startHour: 21, endHour: 22 }
]
```

**例3: 時間帯を制限せず，いつでも送る**

```js
allowedTimeRanges: [
  { startHour: 0, endHour: 24 }
]
```

### 1回に送る文の数を変える

`config_english` の `batchSize` で決まります．初期値は `1` です．

```js
batchSize: 3,   // 1回の実行で3文（3メッセージ）送る
```

**1文につき1メッセージ**送信されるため，`batchSize: 3` なら3通のメッセージが届きます．

> **注意**
> 時間帯の設定と，トリガーの間隔は**どちらも効きます．**
> たとえばトリガーが `1時間おき` でも，`allowedTimeRanges` に9時台しか書かれていなければ，
> 送信されるのは1日1回（9時台）だけです．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 日々の使い方

設定が終われば，あとは自動で届きます．やることは次の2つだけです．

- **英文を足したくなったら** … スプレッドシートに行を追加する
- **最初から送り直したくなったら** … `reset_english_learning_progress` を実行する

送信は，スプレッドシートの最後の行まで届くと自動で止まります．
先頭には戻らないので，同じ文が何度も届くことはありません．

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## うまくいかないとき

まずは，Apps Scriptの画面下部にある **実行ログ** を確認してください．
原因がそのまま文章で表示されていることがほとんどです．

| 症状 | 考えられる原因と対処 |
| --- | --- |
| Discordに何も届かない | 実行ログに `現在時刻は送信対象外です。` と出ていないか確認する．出ていれば `allowedTimeRanges` に今の時刻を含める |
| 実行ログに `送信対象の英文がありません。` と出る | スプレッドシートにデータが入っているか確認する．`config_english` の `sentenceSheetName` と，実際のシート名（シート下部のタブ）が一致している必要がある |
| `シートが見つかりません` と出る | `sentenceSheetName`（既定 `sentences`）と実際のシート名が違う．xlsxを取り込んだ場合はシート名が `sample` になっている |
| `webhookUrl` に関するエラーが出る | 手順1のWebhook URLが正しく貼り付けられているか確認する．URLの前後に余計な空白が入っていないかも確認する |
| `SyntaxError: Identifier 'ENGLISH_LEARNING_SETTINGS' has already been declared` | ひな形と設定ファイルが両方存在している．`config_english` だけを残す |
| スプレッドシートが読めないエラーが出る | `spreadsheetId` が正しいか，そのスプレッドシートを自分のアカウントで開けるか確認する |
| 最後まで送信済みで止まった | `reset_english_learning_progress` を実行すると先頭から送り直せる |
| 実行時間を超えたエラーが出る | `batchSize` が大きすぎる可能性がある．GASの1回の実行は6分までなので，値を小さくする |

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>

## 次に読むもの

| ドキュメント | 内容 |
| --- | --- |
| [README](../README.md) | 機能と設定項目のリファレンス．`config_english.js` の全項目と既定値の一覧 |
| [チャンク分割ルール](chunking_rules.md) | 英文をどこで区切るかの基準．**学習データを増やす前に読んでください** |
| [開発環境の準備](development_environment.md) | claspを使い，パソコン上のエディタでコードを編集したい人向け |

<p align="right">(<a href="#getting-started-top">上に戻る</a>)</p>
