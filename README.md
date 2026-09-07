<a name="readme-top"></a>

# Googleカレンダー Discord リマインダーBOT

Googleカレンダーの予定を，毎朝Discordへ自動で送るBOTです．

Googleアカウントがあれば無料で使えます．

<details>
  <summary>目次</summary>
  <ol>
    <li><a href="#どんなものか">どんなものか</a></li>
    <li><a href="#届くメッセージ">届くメッセージ</a></li>
    <li><a href="#ドキュメント一覧">ドキュメント一覧</a></li>
    <li><a href="#使いはじめる">使いはじめる</a></li>
    <li><a href="#しくみ">しくみ</a></li>
    <li><a href="#通知対象">通知対象</a></li>
    <li><a href="#ラベルによる通知対象の制御">ラベルによる通知対象の制御</a></li>
    <li><a href="#通知タイミング">通知タイミング</a></li>
    <li><a href="#実行アカウントとカレンダー権限">実行アカウントとカレンダー権限</a></li>
    <li><a href="#calendarapp-とセットアップ">CalendarApp とセットアップ</a></li>
    <li><a href="#設定項目一覧">設定項目一覧</a></li>
    <li><a href="#実行できる関数">実行できる関数</a></li>
    <li><a href="#ファイル構成">ファイル構成</a></li>
    <li><a href="#clasp設定">clasp設定</a></li>
    <li><a href="#git管理上の注意">Git管理上の注意</a></li>
    <li><a href="#関連資料">関連資料</a></li>
    <li><a href="#作成者">作成者</a></li>
    <li><a href="#ライセンス">ライセンス</a></li>
  </ol>
</details>

## どんなものか

Googleカレンダーに入っている予定を，毎朝Discordへ自動で送るBOTです．

Googleアカウントがあれば**無料**で使えます．パソコンを起動しておく必要もありません．

- 今日の予定と明日の予定を，1通のメッセージにまとめて送る
- 予定の色（ラベル）で，通知する種類を絞り込める
- 説明欄も指定した文字数まで一緒に表示する
- 通知する時刻・内容はすべて設定で変えられる

Googleカレンダーには研究・打ち合わせ・私用・アルバイトなど複数の予定が混ざりがちです．
その中から**必要な予定だけをDiscordへ再通知**して，見落としを防ぐことを目的にしています．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 届くメッセージ

毎朝，その日と翌日の予定がまとめて1通で届きます．

```text
## 📅 本日の予定
### 2026年7月3日（金）

**14:30〜16:00**
> [会社タスク] 企画書のレビュー
> └ 先方へ提出する企画書の内容を確認し、修正点を洗い出す...続きはカレンダー

**20:00〜21:15**
> [アルバイト] アルバイト

[🔗 Googleカレンダーで確認](リンク)

---

## 📅 明日の予定
### 2026年7月4日（土）

**10:00〜12:00**
> [会社タスク] 定例会

[🔗 Googleカレンダーで確認](リンク)
```

`[ ]` の中は，予定の色に付けた名前です．説明欄は指定した文字数で切り詰めて表示します．
末尾のリンクを開いたときの表示形式（日・週・月・年）は `calendarLinkView` で変えられます．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ドキュメント一覧

目的に応じて，次のドキュメントを読んでください．

| ドキュメント | 読むタイミング | 内容 |
| --- | --- | --- |
| **[docs/getting_started.md](docs/getting_started.md)** | **まずここから** | セットアップ手順．WebhookのURL取得から自動送信の設定まで，画面操作の順に説明しています．**プログラミングの知識は不要です** |
| [docs/label_setup.md](docs/label_setup.md) | 予定を絞り込みたいとき | 色でラベルを見分けるしくみの詳しい説明．うまく動かないときの調べ方 |
| [docs/development_environment.md](docs/development_environment.md) | コードを編集したいとき | claspを使い，パソコン上のエディタでコードを編集するための環境構築手順．BOTを動かすだけなら不要です |

このREADMEは，**機能と設定項目のリファレンス**です．
セットアップの実際の操作手順は [docs/getting_started.md](docs/getting_started.md) にあります．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 使いはじめる

はじめて使う場合は [docs/getting_started.md](docs/getting_started.md) を開いてください．
所要時間は30分〜1時間です．

大まかな流れは次のとおりです．

```text
1. Discord で Webhook URL を取得する
2. （必要なら）カレンダーの予定に色を付ける
3. Apps Script にコードを貼り付ける
4. config_calendar.js に Webhook URL を書く
5. test_send_discord_message でテスト送信する
6. （必要なら）sync_calendar_label_registry でラベルを覚えさせる
7. calendar_reminder_main で手動送信を確認する
8. トリガーを設定して自動化する
```

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## しくみ

```text
Googleカレンダー          Google Apps Script            Discord
  今日の予定      →      毎朝1回，予定を読んで    →     メッセージが届く
  明日の予定             メッセージを組み立てる
```

- 実行基盤は Google Apps Script（GAS）
- カレンダーの読み取りは GAS 組み込みの `CalendarApp`（Google Cloud の設定は不要）
- Discord への送信は Webhook
- 実行タイミングは GAS の時間主導型トリガー

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 通知対象

対象とするカレンダーは，`calendarId` に指定した1件です．

### 対象

- `calendarId: "primary"` による自分のメインカレンダー
- `calendarId` に指定した共有カレンダーやサブカレンダー

### 対象外

- 同時に複数のカレンダーを巡回する使い方
- 実行時にログインユーザーを切り替えて別人の `primary` を読む使い方

現在の実装では，`calendarId` に指定できる対象は1つだけです．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ラベルによる通知対象の制御

Googleカレンダーの予定に付けた色で，通知する予定を絞り込めます．

ただし Googleカレンダーは，ラベルに付けた名前をプログラムへ渡してくれません．
届くのは色を表す値だけです．そのため初回だけ「そのラベルを付けた既存予定」を1件指定して，
BOTに「この予定と同じ色を，この名前で呼ぶ」と教えます．

**色番号の意味はカレンダーごとに違う**ため，設定はカレンダー単位で書きます．

まず `gas/config_calendar.js` の `CALENDAR_BOOK` にカレンダーを登録します．
**長いカレンダーIDを書くのはここだけ**です．

```js
const CALENDAR_BOOK = {
  "メインカレンダー": "primary",
  "サブカレンダー1": "xxxx@group.calendar.google.com"
};
```

次に `gas/config_labels.js` へ，**同じ呼び名で**ラベル設定を書きます．

```js
const CALENDAR_LABEL_PROFILES = {

  "メインカレンダー": {
    seeds: [
      { labelName: "会社タスク",   sampleDate: "2026/07/05" },
      { labelName: "アルバイト",   sampleDate: "2026/07/05" }
    ]
  },

  "サブカレンダー1": {
    seeds: [
      { labelName: "重要", sampleDate: "2026/08/31" }
    ]
  }
};
```

見本の予定の件名がラベル名と同じなら `sampleEventTitle` は**省略できます**．
違う件名の予定を見本にしたいときだけ書きます．

```js
{ labelName: "会社タスク", sampleDate: "2026/07/05",
  sampleEventTitle: "定例ミーティング" },
```

`デフォルト`（色なしの予定）は自動で通知対象に加わるため，書く必要はありません．

カレンダーを切り替えるときは，`calendarId` に呼び名を書くだけです．

```js
calendarId: "サブカレンダー1",
```

サブカレンダーを増やしたいときは，`CALENDAR_BOOK` に1行足して，
`CALENDAR_LABEL_PROFILES` に同じ呼び名のブロックを足します．

`gas/config_calendar.js` で `targetEventLabels` を切り替えると有効になります．

```js
targetEventLabels: true,                 // プロファイルの labels で絞り込む
targetEventLabels: ["会社タスク"],       // 特定のラベルだけに絞る
targetEventLabels: false,                // すべての予定を通知
```

書いたあと `sync_calendar_label_registry` を1回実行すると，色を覚えます．
覚えた内容は Script Properties に保存されるため，見本の予定はあとで削除しても構いません．

- 色はパレットのものでも，カラーピッカーで作ったものでも使えます
- ただし別々のラベルに同じ色を使うと区別できません
- `デフォルト` という名前は特別で，色なしの予定に自動で割り当てられます
- `seeds` に書いたラベルがそのまま通知対象になります
- 通知対象をさらに絞りたいときだけ `labels: ["重要", "デフォルト"]` を足します

### カレンダーを切り替えたとき

`calendarId` の呼び名を書き換えて実行すると，**対応表は自動で作り直されます．**
色番号の意味はカレンダーごとに違うため，前のカレンダーの対応表は破棄されます．
`clear_calendar_label_registry` を手で実行する必要はありません．

対応表は**常に1カレンダー分だけ**保存されます．
複数カレンダーの対応表を同時に持つことはできませんが，
`CALENDAR_LABEL_PROFILES` に書いておけば切り替えのたびに自動で覚え直します．

プロファイルを書いていないカレンダーを指定した場合は，
色なしの予定を `デフォルト` として扱う既定動作になり，実行ログに警告が出ます．

`CALENDAR_BOOK` に無い呼び名を書いた場合は，書き間違いとして実行時にエラーになります．
エラー文には登録済みの呼び名が一覧で出ます．

**しくみの詳細・設定の書き方・うまく動かないときの調べ方は
[docs/label_setup.md](docs/label_setup.md) にあります．**

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 通知タイミング

通知は「当日分」と「翌日分」の2種類で，どちらも `gas/config_calendar.js` で切り替えます．

```js
enableTodayReminder: true,      // 当日の予定を通知する
enableTomorrowReminder: true,   // 翌日の予定を通知する
```

実行するのは `calendar_reminder_main` の1つだけです．
この関数は実行時に上の2つを見て，当日分を先に，翌日分を後に置き，
**1回のメッセージへまとめて送ります．** 両方 `true` でも送信は1回です．

通知時刻は GAS の時間主導型トリガーで決まります．コード側に時刻の設定はありません．
トリガーの作り方は [docs/getting_started.md](docs/getting_started.md) の手順8にあります．

> **注意**
> GAS の時間主導型トリガーは，指定した時間帯の中で実行されます．
> 「午前7時〜8時」を選ぶと 7:00 ちょうどではなく 7:23 などになります．
>
> また，このBOTには「同じ日に何度も送らない」制御がありません．
> **1時間おきのトリガーにすると1時間ごとに再通知されます．**
> 必ず「日付ベースのタイマー」を選んでください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 実行アカウントとカレンダー権限

このBOTは「ログインした人を自動判定してその人のカレンダーを読むBOT」ではありません．Apps Script を認可してトリガーを作成した Google アカウントの権限で動きます．

`calendarId: "primary"` の場合は，その実行アカウント自身のメインカレンダーを読みます．

また，`calendarId` に特定のカレンダーIDを入れた場合は，その実行アカウントが閲覧権限を持ち，かつ必要に応じてラベルを扱える1件のカレンダーを読みます．

つまり，現在の実装でできることは次です．

- 自分のメインカレンダーを通知する
- 自分が閲覧できる共有カレンダーやサブカレンダーを1件だけ通知する

現在の実装でできないことは次です．

- 実行時にログインユーザーを切り替えて別人の `primary` を読む
- 1つのトリガーで複数ユーザーの個人カレンダーをまとめて巡回する
- ユーザーごとにOAuthログインさせて個別設定を持つSaaS風の運用

個人利用の範囲を少し広げたい場合は，次の方法が現実的です．

- 共有カレンダーを1つ作り，そのカレンダーIDを `calendarId` に設定する
- 通知専用のGoogleアカウントを1つ用意し，対象カレンダーをそのアカウントに共有して，そのアカウントでトリガーを作る

より本格的に「ログインした各ユーザーのカレンダーをそれぞれ通知したい」場合は，GAS 単体よりも，OAuthログイン，ユーザーごとのトークン保存，定期実行基盤を持つサーバーアプリ構成のほうが向いています．

<details>
  <summary>このBOTが実際に誰の権限で動くか</summary>

- `calendarId: "primary"` は「そのときブラウザで見ている人」ではなく，「Apps Script を認可してトリガーを作った Google アカウント」のメインカレンダーを意味します
- 手動実行でもトリガー実行でも，基本的にはそのスクリプトを認可したアカウント権限でカレンダーが読まれます
- そのため，別の人の `primary` を勝手に読めるわけではありません

</details>

<details>
  <summary>calendarId に設定できる値</summary>

- `primary`
- 自分のメインカレンダーのメールアドレス形式のID
- 共有カレンダーやサブカレンダーの `xxxxxxxxxxxx@group.calendar.google.com` 形式のID

カレンダーIDは Googleカレンダーの次の場所で確認できます．

- 設定
- マイカレンダーの設定
- 対象カレンダー
- カレンダーの統合
- カレンダー ID

</details>

<details>
  <summary>他人のカレンダーを読める条件</summary>

次のいずれかに当てはまるカレンダーだけを読めます．

- 実行アカウント本人のカレンダー
- 実行アカウントへ共有されているカレンダー
- 公開設定されているカレンダー
- 適切な権限付与が済んでいるカレンダー

逆に，`calendarId` に他人のメールアドレスを書いただけでは予定は取得できません．権限がなければ API エラーになります．

</details>

<details>
  <summary>初回実行時の承認について</summary>

Googleカレンダーは個人情報を含むため，このBOTを初回実行すると Google の承認画面が出ます．

`CalendarApp` を使っているので，事前の設定作業はありません．画面の指示にしたがって「許可」を押すだけです．

他の人がこのBOTを使う場合は，その人が自分の Apps Script プロジェクトを持ち，自分のアカウントで承認します．

</details>

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## CalendarApp とセットアップ

このBOTは GAS 組み込みの `CalendarApp` でカレンダーを読みます．Google Calendar API を直接叩いていないため，**Google Cloud 側の設定は一切不要です．**

### 必要ないもの

- Google Cloud プロジェクトの作成
- Google Calendar API の有効化
- Apps Script への Cloud プロジェクト番号の紐付け
- OAuth 同意画面の設定・テストユーザーの登録

これらは，公開APIである Calendar API を外部から叩くときに必要になる手続きです．`CalendarApp` は GAS の中から Google のサービスへ直接アクセスするため，どれも必要ありません．

### 必要なこと

初回実行時に承認画面が出るので，「許可」を押すだけです．Apps Script が自動的に画面を出すので，事前の登録作業はありません．

承認するスコープは `gas/appsscript.json` に書かれた次の3つです．

| スコープ | 用途 |
| --- | --- |
| `calendar` | `CalendarApp` によるカレンダー読み取り |
| `script.external_request` | Discord Webhook への送信 |
| `script.storage` | Script Properties へのラベルレジストリ保存 |

`CalendarApp` は読み取りだけの用途でも `calendar` スコープを要求します．

あわせて `appsscript.json` で **Advanced Calendar Service**（`Calendar` v3）を有効にしています．
Googleカレンダーの**名前付きラベル**は `CalendarApp` から取得できず，
このサービス経由でのみ `eventLabelId` を読めるためです．

Apps Script 標準の機能なので，**Cloud プロジェクトの作成もAPIキーも不要**です．
スコープも上の3つから増えません．

### config に書く値

`gas/config_calendar.js` に書くのは `calendarId`，Webhook URL，通知条件です．Cloud のプロジェクト番号やプロジェクトIDを書く場所はありません．

<details>
  <summary>以前 Calendar API を使っていた頃の設定について</summary>

このBOTは以前 Google Calendar API v3 を `UrlFetchApp` で直接叩いていました．当時は Google Cloud プロジェクトの作成と Calendar API の有効化が必須で，設定を忘れると次のエラーが出ていました．

```text
SERVICE_DISABLED
Google Calendar API has not been used in project ... before or it is disabled.
```

`CalendarApp` へ移行したため，このエラーは発生しなくなりました．過去に作った Google Cloud プロジェクトが残っていても，このBOTの動作には影響しません．

なお，API を使っていた当初の目的は「Googleカレンダー UI のラベル名を取得すること」でしたが，実測の結果 API からもラベル名は返らないことが分かったため，API を使う理由がなくなりました．現在は `CalendarApp` だけで動作します．

</details>

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 設定項目一覧

`gas/config_calendar.js` で設定できる項目の一覧です．

| 項目 | 既定値 | 意味 |
| --- | --- | --- |
| `webhookUrl` | プレースホルダ | Discord の Webhook URL．**必ず自分の値に書き換える** |
| `calendarId` | `"primary"` | 読み取るカレンダー．`"primary"` は実行アカウントのメインカレンダー |
| `targetEventLabels` | `false` | 通知対象のラベル．`false`＝全予定／`true`＝プロファイルの `labels`／配列＝指定したラベルのみ |
| `CALENDAR_BOOK` | — | 使うカレンダーの「呼び名 → カレンダーID」対応．IDを書くのはここだけ |
| `enableTomorrowReminder` | `true` | 明日の予定を通知するか |
| `enableTodayReminder` | `true` | 今日の予定を通知するか |
| `notifyIfEmpty` | `false` | 予定が0件の日も「予定はありません」と通知するか |
| `showDescription` | `true` | 予定の説明欄をメッセージに含めるか |
| `descriptionMaxLength` | `80` | 説明欄を何文字で切り詰めるか |
| `calendarLinkView` | `"week"` | メッセージ末尾のリンクを開いたときの表示形式．`"day"` / `"week"` / `"month"` / `"year"` |
| `calendarUrlBase` | Googleカレンダーの URL | メッセージ末尾のリンクのベースURL |

`gas/config_labels.js` で設定できる項目は次の2つです．

| 項目 | 意味 |
| --- | --- |
| `CALENDAR_LABEL_PROFILES` | 通知したいラベル名の一覧 |
| `CALENDAR_LABEL_REGISTRY_SEEDS` | 各ラベル名に対応する「見本の予定」の指定 |

詳しくは [docs/label_setup.md](docs/label_setup.md) を参照してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 実行できる関数

Apps Script の実行画面やトリガー設定で選べる関数です．

| 関数名 | できること | 主な用途 |
| --- | --- | --- |
| `calendar_reminder_main` | 当日通知を先に，前日通知を後に，1回のメッセージへまとめて送信する | **本番トリガーの実行関数** |
| `calendar_today_reminder_main` | 当日通知だけを作成して送信する | 当日通知だけを個別に動かしたい確認用 |
| `calendar_tomorrow_reminder_main` | 前日通知だけを作成して送信する | 前日通知だけを個別に動かしたい確認用 |
| `test_send_discord_message` | 固定のテスト文面を Discord に送る | Webhook 接続確認 |
| `sync_calendar_label_registry` | 見本の予定から「色 ↔ ラベル名」の対応を覚え直す | 初回設定・色変更後の再同期用 |
| `clear_calendar_label_registry` | 保存済みの対応表を空に戻す | 対応表の作り直し用 |
| `inspect_calendar_labels` | 対応表と，**当日の**各予定の色番号を実行ログに出力する | ラベル診断用 |
| `debug_calendar_seed_candidates` | 見本の日付の**前後30日**から，件名の一致と色を突き合わせて出力する | 見本が見つからないときの原因調べ用 |

通常運用でトリガーに設定するのは **`calendar_reminder_main`** です．

### 診断関数が出力する内容

`inspect_calendar_labels` と `debug_calendar_seed_candidates` は，
実行ログ（Apps Script の「実行数」画面）へ次を出力します．

| 出力項目 | 意味 |
| --- | --- |
| `calendarName` | `calendarId` に書いた呼び名 |
| `calendarId` | 呼び名から解決された実際のカレンダーID |
| `profileSource` | 使われた設定の出どころ．`profile`（正常）／`legacy`（旧形式）／`fallback`（プロファイル未定義） |
| `seedCount` | そのカレンダー用に定義した見本の件数 |
| `colorId` | 予定に付いている色番号 |
| `eventLabelId` | 名前付きラベルの識別子（色番号を持たない予定用） |

`profileSource` が `fallback` になっている場合は，
`config_labels.js` の `CALENDAR_LABEL_PROFILES` にそのカレンダーの項目がありません．

> **内部関数について**
> 上記の関数から呼ばれる `logCalendarLabelRegistry_`，`logCalendarLabelDiagnostics_`，
> `logCalendarSeedCandidates_` は末尾が `_` の内部関数です．
> Apps Script の実行メニューには表示されないため，直接は実行できません．

> **注意**
> どの関数も，実行すると**実際にDiscordへ送信されます．**
> 文面だけ確認したい場合は，`webhookUrl` を一時的にテスト用チャンネルのものへ差し替えてください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## clasp設定

`clasp` を使うと，パソコン上のエディタでコードを編集して GAS へ送れます．

- `.clasp.json` にスクリプトIDを書く（プレースホルダ入りで同梱しています）
- `clasp push` の送信対象は `rootDir` の指定により `gas/` 配下だけ
- `gas/appsscript.json` に必要な3つのスコープを記載済み

環境構築の手順は [docs/development_environment.md](docs/development_environment.md) にあります．
BOTを動かすだけなら clasp は不要です．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ファイル構成

<details>
  <summary>ディレクトリ構成</summary>

```text
.
├── .clasp.json
├── .gitignore
├── AGENTS.md
├── README.md
├── docs
│   ├── development_environment.md
│   ├── getting_started.md
│   └── label_setup.md
└── gas
    ├── appsscript.json
    ├── calendar_api.js
    ├── calendar_diagnostics.js
    ├── calendar_formatters.js
    ├── calendar_labels.js
    ├── config_calendar.js
    ├── config_labels.js
    ├── label_registry.js
    ├── main.js
    ├── reminder_builders.js
    ├── send_discord.js
    ├── settings_resolver.js
    └── utils.js
```

</details>

<details>
  <summary>ファイルごとの役割</summary>

| パス | 役割 |
| --- | --- |
| `README.md` | プロジェクト全体の入口となるメイン説明書 |
| `AGENTS.md` | 複数カレンダー対応の設計メモと，開発時の作業規約 |
| `docs/getting_started.md` | セットアップ手順．初めて使う人向け |
| `docs/label_setup.md` | ラベル（色）のしくみと調べ方 |
| `docs/development_environment.md` | clasp を使う開発環境の構築手順 |
| `.clasp.json` | GASプロジェクト紐付け設定（スクリプトIDを書き込む） |
| `gas/appsscript.json` | GAS プロジェクトのマニフェスト |
| `gas/calendar_api.js` | `CalendarApp` によるカレンダー取得とイベント取得 |
| `gas/calendar_diagnostics.js` | レジストリと各予定の色・ラベルを調べる診断ログ |
| `gas/calendar_formatters.js` | 日時整形，説明文整形，Discord本文生成 |
| `gas/calendar_labels.js` | 通知対象ラベル名の判定とイベント絞り込み |
| `gas/config_calendar.js` | カレンダーBOT向けの主要設定 |
| `gas/config_labels.js` | カレンダーごとの通知対象ラベルと，ラベル同期用サンプル予定の設定 |
| `gas/label_registry.js` | Script Properties に保存するラベルレジストリの管理 |
| `gas/main.js` | Apps Script から実行する入口関数 |
| `gas/reminder_builders.js` | 前日通知・当日通知の payload 組み立て |
| `gas/send_discord.js` | Discord Webhook 送信処理 |
| `gas/settings_resolver.js` | ユーザー設定を実行用設定へ正規化し，Webhook設定も検証する |
| `gas/utils.js` | 小さい共通関数だけをまとめた補助ファイル |

</details>

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## Git管理上の注意

`.clasp.json` や Webhook URL など，環境依存情報や秘密情報は Git に含めないようにしてください．

`git status` で `.clasp.json` がGitの管理対象に含まれていないことを確認してください．

```sh
git status
```

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 関連資料

- [Google Apps Script 公式ドキュメント](https://developers.google.com/apps-script)
- [Apps Script CalendarApp](https://developers.google.com/apps-script/reference/calendar/calendar-app)
- [Apps Script CalendarEvent](https://developers.google.com/apps-script/reference/calendar/calendar-event)
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
| リポジトリ | https://github.com/kurokara-YK/google_calendar_discord_bot |

不具合の報告や改善の提案は，
[Issues](https://github.com/kurokara-YK/google_calendar_discord_bot/issues)
または上記のメールアドレスまでお願いします．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## ライセンス

このリポジトリのコードは自由に利用・改変してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>
