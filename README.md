<a name="readme-top"></a>

# 当番リマインド Discord BOT

Googleスプレッドシートに書いた当番表をもとに，担当者へDiscordでリマインドを送るBOTです．

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
    <li><a href="#通知の条件">通知の条件</a></li>
    <li><a href="#列と行の数を変える">列と行の数を変える</a></li>
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

「誰が」「いつ」当番なのかをスプレッドシートに書いておくと，
このBOTが決まった日にDiscordへリマインドを送ってくれます．

- 担当者を **Discordのメンションで呼び出す**ので，気づかれないまま当日を迎えることがない
- 担当者は**プルダウンから選ぶ**ため，名前の打ち間違いが起きない
- 担当者がいない回でも，`内容` を書いておけばイベント通知として送れる
- 通知を送った回は**チェックボックスが自動で入る**ので，送信状況が一目で分かる
- 当番表と名簿のスプレッドシートは**BOTが自動で作る**（手作業で列を作る必要がない）

研究室のミーティング発表当番を想定して作っていますが，
**掃除当番・司会当番・日直など「表に並んだ担当者を，決まった日にリマインドする」用途**であれば，
設定ファイルの文面を書き換えるだけで使えます．

**このリポジトリに当番表のデータは含まれていません．** 当番表と名簿は利用者が自分で用意します．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 届くメッセージ

担当者がいる回:

```text
来週の発表は@山田 太郎、@鈴木 花子です。よろしくお願いします。
要旨添削は月曜日の13時までに提出しましょう。
内容: S1
```

担当者がいない回（`内容` だけが書かれている回）:

```text
@everyone 来週はガイダンスがあります。よろしくお願いします。
要旨添削が必要な場合は月曜日の13時までに提出しましょう。
```

文面はすべて設定ファイルで変更できます．
`{assignees}`（担当者のメンション），`{content}`（内容列），`{dutyDate}`（担当日）が使えます．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ドキュメント一覧

目的に応じて，次のドキュメントを読んでください．

| ドキュメント | 読むタイミング | 内容 |
| --- | --- | --- |
| **[docs/getting_started.md](docs/getting_started.md)** | **まずここから** | セットアップ手順．WebhookのURL取得から自動送信の設定まで，画面操作の順に説明しています |
| [docs/sheet_format.md](docs/sheet_format.md) | 当番表を書くとき | 当番表と名簿の書き方．日付の入力方法や，担当者プルダウンの使い方 |
| [docs/development_environment.md](docs/development_environment.md) | コードを編集したいとき | claspを使い，パソコン上のエディタでコードを編集するための環境構築手順．BOTを動かすだけなら不要です |

このREADMEは，**機能と設定項目のリファレンス**です．
セットアップの実際の操作手順は [docs/getting_started.md](docs/getting_started.md) にあります．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 使いはじめる

大まかな流れは次のとおりです．画面ごとの手順は
[docs/getting_started.md](docs/getting_started.md) を参照してください．

1. DiscordでWebhook URLを取得する
2. Apps Scriptにコードを反映する
3. `create_roster_spreadsheet` を実行して当番表を作る
4. 出力されたURLを `gas/config_roster.js` に貼り付ける
5. 名簿に名前とDiscord IDを入力する
6. 当番表に日付と担当者を入力する
7. `preview_message` で送信内容を確認する
8. トリガーを設定して自動送信を始める

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## しくみ

```text
Googleスプレッドシート   … 当番表（誰がいつ担当か）と名簿（名前とDiscord ID）
        ↓
Google Apps Script      … 通知日になったら表を読んで本文を組み立てる
        ↓
Discord Webhook         … チャンネルへ通知が届く
```

**Google Apps Script（GAS）** はGoogleが無料で提供している
「Googleのサーバー上でプログラムを動かす仕組み」です．
自分のパソコンの電源が切れていても，設定した時刻に自動で動きます．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## スプレッドシートの形式

BOTが作るスプレッドシートには，**当番表**と**名簿**の2つのシートがあります．

### 当番表シート

1行目が見出し，2行目以降がデータです．

| 列 | 項目 | 内容 |
| --- | --- | --- |
| A列 | `No.` | 回番号．`なし`，`補講` などの文字も入れられる |
| B列 | `担当日` | 当番を担当する日 |
| C列 | `通知日` | この日にDiscordへ通知する．空欄なら担当日から自動計算 |
| D〜K列 | `1人目`〜`8人目` | 担当者．**プルダウンから選ぶ**．いない回は空欄 |
| L列 | `内容` | S1，ガイダンスなど．**通知文に載る** |
| M列 | `メモ` | 自由記入欄．**通知には使わない** |
| N列 | `通知済み` | 通知を送るとチェックが入る．**外すともう一度送れる** |

記入例:

| No. | 担当日 | 通知日 | 1人目 | 2人目 | 内容 | メモ | 通知済み |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026/09/17 | 2026/09/11 | | | ガイダンス | 新入生歓迎会もあり | ☑ |
| 2 | 2026/09/24 | 2026/09/18 | 山田 太郎 | 鈴木 花子 | S1 | | ☐ |

`内容` と `メモ` の違いは，**Discordへ送られるかどうか**です．
通知したい情報は `内容` に，自分たちの覚え書きは `メモ` に書きます．

日付のセルを**ダブルクリックするとカレンダーが開き**，そこから選べます．
`9/17` のように年を省略して入力することもできます．
その場合の年は設定の `fiscalStartYear` から決まり，
年度開始月より前の月は翌年になります（2026年度なら `1/7` は2027年）．

### 名簿シート

| 列 | 項目 | 内容 |
| --- | --- | --- |
| A列 | `名前` | 当番表のプルダウンに出る名前 |
| B列 | `Discord ID` | メンション用のユーザーID |
| C列 | `メモ` | 学年など．BOTは読まない |

DiscordユーザーIDは，Discordの「設定」→「詳細設定」→「開発者モード」をオンにしてから，
ユーザーを右クリック →「ユーザーIDをコピー」で取得できます．

IDが空欄の人は，メンションされず名前だけで通知されます．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 通知の条件

`duty_roster_main()` は，**通知日が来ていて，まだ送っていない回**を送ります．

| 条件 | 動作 |
| --- | --- |
| 担当者が1人以上いる | 担当者へメンション付きで通知 |
| 担当者はいないが `内容` がある | イベント情報として通知 |
| 担当者も `内容` も無い | 何も送らない |
| `担当日` も `通知日` も空 | 何もしない（予定が決まれば処理される） |
| `通知済み` にチェックがある | 送信済みとしてスキップ |

**毎日実行して構いません．** 通知日でない日は何も送られません．

### 通知済みチェックボックス

通知を送ると，その回の `通知済み` 列に**自動でチェックが入ります．**
同じ回が二度送られることはありません．

**もう一度送りたい回は，チェックを外すだけです．**

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 列と行の数を変える

担当者の人数と当番表の行数は，`gas/config_roster.js` で決まります．

```js
assigneeColumnCount: 8,   // 「1人目」〜「8人目」の8列を作る
rosterRowCount: 20,       // データ行を20行用意する
```

`assigneeColumnCount` を変えると，**列が自動で増減し，
右にある `内容`・`メモ`・`通知済み` の位置もずれます．** 列を手で足す必要はありません．

| 設定値 | できる列 | 合計 |
| --- | --- | --- |
| `4` | No. / 担当日 / 通知日 / 1人目〜4人目 / 内容 / メモ / 通知済み | 10列 |
| `8` | No. / 担当日 / 通知日 / 1人目〜8人目 / 内容 / メモ / 通知済み | 14列 |
| `12` | No. / 担当日 / 通知日 / 1人目〜12人目 / 内容 / メモ / 通知済み | 18列 |

変更したら `create_roster_spreadsheet` でシートを作り直します．
**運用中のシートに実行すると入力済みの内容が消える**ため，
新しい学期を始めるときなどに行ってください．

行が足りなくなった場合は，シート上で行を追加しても構いません．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 設定項目一覧

`gas/config_roster.js` で設定します．

### 接続先

| 設定名 | 説明 |
| --- | --- |
| `label` | 実行ログに出る表示名 |
| `webhookUrl` | DiscordのWebhook URL |
| `spreadsheetId` | 当番表スプレッドシートのURL |
| `templateFolderId` | 作成先のGoogleドライブのフォルダURL |

### シート

| 設定名 | 説明 |
| --- | --- |
| `fileName` | 作成されるスプレッドシートの名前 |
| `rosterSheetName` | 当番表シート名 |
| `memberSheetName` | 名簿シート名 |
| `assigneeColumnCount` | 担当者列の数 |
| `rosterRowCount` | 当番表に用意する行数 |

### 日付

| 設定名 | 説明 |
| --- | --- |
| `fiscalStartYear` | 年度の開始年．年を省略した日付に年を補うために使う |
| `fiscalStartMonth` | 年度の開始月．日本の年度なら `4` |
| `noticeOffsetDays` | 通知日が空のとき，担当日の何日前とみなすか |

### 文面

| 設定名 | 説明 |
| --- | --- |
| `assigneeMessageTemplate` | 担当者がいる回の文面 |
| `contentSuffixTemplate` | 担当者がいる回に，内容を末尾へ足す文面 |
| `eventMessageTemplate` | 内容だけの回の文面 |
| `unknownMemberTemplate` | Discord IDが未登録の人の表示 |
| `assigneeSeparator` | 担当者メンションのつなぎ文字 |

文面では次の変数が使えます．

| 変数 | 内容 |
| --- | --- |
| `{assignees}` | 担当者のメンション |
| `{content}` | 内容列の値 |
| `{dutyDate}` | 担当日（例: `9月24日`） |

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 実行できる関数

Apps Scriptエディタの「実行する関数」から選べます．

| 関数 | 用途 |
| --- | --- |
| `duty_roster_main` | **本番用．** トリガーにはこれを設定する |
| `create_roster_spreadsheet` | 当番表と名簿を新規作成する（**最初の1回だけ**） |
| `preview_message` | 今日送られる本文を確認する（**送信しない**） |
| `check_settings` | 設定・シート・名簿の登録漏れを確認する |
| `test_send_discord` | Discordへ届くかだけ確かめる |

動作を変えたときは，まず `preview_message` で確認してください．
送信も記録も行わないため，何度でも安全に試せます．

`create_roster_spreadsheet` は**最初の1回だけ**使います．
運用中のシートへ実行すると入力済みの内容が消えます．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ファイル構成

<details>
  <summary>各ファイルの説明を開く</summary>

| ファイル | 説明 |
| --- | --- |
| `gas/appsscript.json` | GASプロジェクトの設定．タイムゾーン，ログ出力，V8ランタイムを定義します |
| `gas/config_roster.js` | **利用者が編集する設定ファイル．** Webhook URL，シート名，文面テンプレート |
| `gas/main.js` | エントリーポイント．Apps Scriptの実行メニューに出る関数をまとめています |
| `gas/roster.js` | 当番表と名簿の読み取り，送信対象の判定，Discord本文の組み立て |
| `gas/columns_def.js` | 当番表と名簿の行・列構造の定義．列位置はすべてここから計算されます |
| `gas/spreadsheet_template.js` | スプレッドシートの新規作成，書式設定，プルダウンの設定 |
| `gas/send_discord.js` | Discord WebhookへのPOST送信 |
| `gas/utils.js` | 日付・文字列の共通処理と，設定値の読み取り |

</details>

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## Git管理上の注意

`.clasp.json` と `gas/config_roster.js` は，
**プレースホルダの状態でリポジトリに含めています．**

自分のスクリプトIDやWebhook URLを書き込んだあとは，
次のコマンドで変更が追跡されないようにしてください．

```sh
git update-index --skip-worktree .clasp.json
git update-index --skip-worktree gas/config_roster.js
```

> **注意**
> Webhook URLを知っている人は，そのDiscordチャンネルへメッセージを送信できます．
> URLを他人に共有したり，公開リポジトリに載せたりしないでください．
> 誤って公開した場合は，Discord側でそのウェブフックを削除して作り直してください．

詳しくは [docs/development_environment.md](docs/development_environment.md) の
「Git 管理上の注意」を参照してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## うまくいかないとき

まず `check_settings` を実行し，実行ログを確認してください．

| 症状 | 確認すること |
| --- | --- |
| 通知が飛ばない | `preview_message` で今日が対象日か．`通知済み` にチェックが付いていないか |
| メンションされない | `check_settings` で名簿の登録漏れを確認する |
| シートが見つからない | `rosterSheetName` が実際のタブ名と一致しているか |
| 日付が1年ずれる | `fiscalStartYear` が正しい年度か．年をまたぐ学期は特に注意 |
| 担当者が入力できない | プルダウンのため名簿に無い名前は入らない．名簿へ追加する |
| 担当者の列が足りない | `assigneeColumnCount` を増やしてシートを作り直す |
| もう一度送りたい | `通知済み` のチェックを外す |

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 関連資料

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
| リンク集 | https://lit.link/kurokara |

不具合の報告や改善の提案は，Issues または上記のメールアドレスまでお願いします．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ライセンス

このリポジトリのコードは自由に利用・改変してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>
