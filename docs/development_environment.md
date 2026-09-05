<a name="dev-env-top"></a>

# 開発環境の準備

ローカルでコードを編集し，`clasp` でGoogle Apps Scriptへ反映するための準備です．

Apps Scriptの画面へ直接コピー＆ペーストして使う場合，この手順は必要ありません．

<details>
  <summary>目次</summary>
  <ol>
    <li><a href="#環境条件">環境条件</a></li>
    <li><a href="#nodejs-のインストール">Node.jsのインストール</a></li>
    <li><a href="#clasp-のインストール">claspのインストール</a></li>
    <li><a href="#google-アカウントでログインする">Googleアカウントでログインする</a></li>
    <li><a href="#プロジェクトと接続する">プロジェクトと接続する</a></li>
    <li><a href="#よく使うコマンド">よく使うコマンド</a></li>
    <li><a href="#ローカルでの構文チェック">ローカルでの構文チェック</a></li>
  </ol>
</details>

## 環境条件

| System | Version |
| --- | --- |
| Ubuntu | 24.04 |
| Node.js | 22.0.0以上 |
| clasp | 最新版 |

補足: Node.jsはJavaScriptをローカルPC上で実行するための環境です．npmはNode.js向けのパッケージ管理ツールです．claspのインストールにはnpmを使います．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## Node.jsのインストール

```sh
# バージョンの確認
node --version
npm --version
```

インストールされていない場合は，[Node.js公式サイト](https://nodejs.org/) から導入してください．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## claspのインストール

claspは，Apps Scriptのコードをローカルと同期するための公式コマンドです．

```sh
npm install -g @google/clasp
clasp --version
```

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## Googleアカウントでログインする

```sh
clasp login
```

ブラウザが開くので，使用するGoogleアカウントで許可します．

あわせて [Apps Script API の設定](https://script.google.com/home/usersettings) を開き，**「Google Apps Script API」をオン**にしてください．オフのままだと `clasp push` が失敗します．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## プロジェクトと接続する

`.clasp.json` が，自分のApps ScriptプロジェクトのIDを指しているか確認します．

```json
{
  "scriptId": "自分のスクリプトID",
  "rootDir": "gas"
}
```

スクリプトIDは，Apps Scriptエディタの「プロジェクトの設定」で確認できます．URLからも読み取れます．

```text
https://script.google.com/home/projects/スクリプトID/edit
```

`rootDir` が `gas` になっているため，`gas/` の中身だけがGASへ送られます．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## よく使うコマンド

```sh
# ローカルの内容をGASへ反映する
clasp push

# GASのエディタをブラウザで開く
clasp open

# GAS側の内容をローカルへ取り込む（ローカルの変更は上書きされる）
clasp pull

# 実行ログを見る
clasp logs
```

`clasp push` はローカルの内容でGAS側を上書きします．GASの画面で直接編集した内容がある場合は，先に `clasp pull` で取り込んでください．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## ローカルでの構文チェック

GASの機能（`SpreadsheetApp` など）はローカルでは動きませんが，**書き間違いの確認**はできます．

```sh
for f in gas/*.js; do node --check "$f" || echo "NG: $f"; done
```

何も出力されなければ，構文エラーはありません．`clasp push` の前に実行しておくと，GAS側でエラーを探す手間が減ります．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## Git 管理上の注意

このリポジトリは公開されています．**個人の設定値をコミットしないでください．**

次の2つのファイルは，**プレースホルダの状態でリポジトリに含めています．**

| ファイル | 入る個人情報 |
| --- | --- |
| `.clasp.json` | 自分のApps ScriptプロジェクトのスクリプトID |
| `gas/config_roster.js` | Discord Webhook URL，スプレッドシートのURL，フォルダのURL |

自分の値を書き込んだあとは，次のコマンドで変更が追跡されないようにしてください．

```sh
git update-index --skip-worktree .clasp.json
git update-index --skip-worktree gas/config_roster.js
```

これで，ファイルを編集してもGitが変更を検知しなくなります．

元に戻したい場合（ファイル自体を更新したいときなど）は，次のコマンドで解除します．

```sh
git update-index --no-skip-worktree .clasp.json
git update-index --no-skip-worktree gas/config_roster.js
```

### コミット前の確認

```sh
git status
git diff
```

Webhook URLやスクリプトIDが含まれていないか，必ず確認してください．

> **Webhook URLが漏れた場合**
> URLを知っている人は，そのDiscordチャンネルへ自由にメッセージを投稿できます．
> 公開してしまった場合は，**Discord側でそのウェブフックを削除して作り直してください．**
> チャンネルの設定 →「連携サービス」→「ウェブフック」から操作できます．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>
