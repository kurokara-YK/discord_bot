<a name="dev-env-top"></a>

# 開発環境の準備（clasp でコードを編集する人向け）

このページは，**このBOTのコードをパソコン上で編集したい人**のための手順です．

BOTを動かすだけなら，このページは読まなくて構いません．
その場合は [はじめかた](getting_started.md) だけを読んでください．

<details>
  <summary>目次</summary>
  <ol>
    <li><a href="#このページでやること">このページでやること</a></li>
    <li><a href="#用語の説明">用語の説明</a></li>
    <li><a href="#動作環境">動作環境</a></li>
    <li><a href="#1-nodejs-と-npm-をインストールする">1. Node.js と npm をインストールする</a></li>
    <li><a href="#2-clasp-をインストールする">2. clasp をインストールする</a></li>
    <li><a href="#3-google-アカウントにログインする">3. Google アカウントにログインする</a></li>
    <li><a href="#4-gas-プロジェクトをパソコンに取り込む">4. GAS プロジェクトをパソコンに取り込む</a></li>
    <li><a href="#5-clasp-の基本操作">5. clasp の基本操作</a></li>
    <li><a href="#git-管理上の注意">Git 管理上の注意</a></li>
    <li><a href="#うまくいかないとき">うまくいかないとき</a></li>
  </ol>
</details>

## このページでやること

このBOTは **Google Apps Script（GAS）** という，Googleのサーバー上で動くプログラムでできています．

GASのコードは，ブラウザ上のエディタでそのまま編集できます．
ただしファイル数が増えてくると，普段使っているエディタ（VS Codeなど）で編集したくなります．

そこで **clasp** という道具を使うと，GASのコードをパソコンに取り込んで，
手元で編集し，編集した内容をGASへ送り返せるようになります．

```text
Google Apps Script（クラウド上）
        ↑ clasp push（送る）
        ↓ clasp pull（取り込む）
自分のパソコン（VS Code などで編集）
```

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## 用語の説明

はじめての人向けに，出てくる言葉をまとめます．

| 言葉 | 意味 |
| --- | --- |
| ターミナル | 文字でパソコンに命令を出す画面．Ubuntuでは「端末」というアプリ |
| コマンド | ターミナルに打ち込む命令の1行 |
| Node.js | JavaScriptというプログラミング言語を，自分のパソコン上で動かすための土台 |
| npm | Node.js用の道具を配布・インストールする仕組み |
| Volta | Node.js のバージョンを管理してくれる道具 |
| clasp | GASのコードをパソコンとやり取りするための道具 |
| スクリプトID | GASプロジェクト1つ1つに割り当てられた固有の文字列 |

以降に出てくるコード枠の中身が「ターミナルに打ち込むコマンド」です．
1行ずつコピーして貼り付け，Enterキーを押して実行してください．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## 動作環境

以下の環境で確認しています．

| 項目 | バージョン |
| --- | --- |
| Ubuntu | 24.04 |
| Node.js | 22.0.0 以上 |

macOS や Windows でも clasp 自体は動きますが，コマンドの書き方が一部異なります．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## 1. Node.js と npm をインストールする

clasp は Node.js の上で動くため，まず Node.js を入れます．
ここでは **Volta** を使ってインストールします．Voltaを使うと，あとからバージョンを変えたくなったときに切り替えやすくなります．

1. パッケージ一覧を更新し，必要なコマンドを入れます．

    ```sh
    sudo apt update
    sudo apt install -y curl git
    ```

    `sudo` を使うとパスワードを聞かれます．普段パソコンにログインするときのパスワードを入力してください．
    入力しても画面に文字は表示されませんが，正しく入力されています．

2. Volta をインストールします．

    ```sh
    curl https://get.volta.sh | bash
    ```

3. インストール結果をターミナルに反映させます．

    ```sh
    source ~/.bashrc
    ```

4. Volta が入ったか確認します．バージョン番号が表示されれば成功です．

    ```sh
    volta --version
    ```

5. Node.js（と npm）をインストールします．

    ```sh
    volta install node
    ```

6. Node.js と npm が入ったか確認します．

    ```sh
    node --version
    npm --version
    ```

    `node` が `v22.0.0` 以上であればそのまま進めます．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## 2. clasp をインストールする

1. clasp をインストールします．

    ```sh
    npm install -g @google/clasp
    ```

    `-g` は「パソコン全体で使えるように入れる」という意味です．

2. clasp が入ったか確認します．

    ```sh
    clasp --version
    ```

3. ブラウザで [Google Apps Script API の設定画面](https://script.google.com/home/usersettings) を開き，
   **Google Apps Script API** を **オン** にします．

    これをオンにしないと，次のログイン手順が失敗します．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## 3. Google アカウントにログインする

1. GAS を編集する Google アカウントで clasp にログインします．

    ```sh
    clasp login
    ```

2. ブラウザが自動で開くので，対象の Google アカウントを選び，アクセスを許可します．

    - ブラウザが開かない場合は，ターミナルに表示された URL をコピーしてブラウザに貼り付けてください
    - 「このアプリは Google で確認されていません」という警告が出た場合は，
      内容を確認したうえで「詳細」→「（安全ではないページ）に移動」を選ぶと進めます
    - ターミナルに `Authorization successful.` のような表示が出れば成功です

3. ログイン情報のファイルができたか確認します．

    ```sh
    ls -la ~ | grep clasprc
    ```

> **注意**
> `~/.clasprc.json` には，あなたの Google アカウントのログイン情報が保存されています．
> **他人に渡したり，Gitで管理したり，どこかにアップロードしたりしないでください．**
> 誤って消してしまった場合は，`clasp login` をもう一度実行すれば作り直せます．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## 4. GAS プロジェクトをパソコンに取り込む

### スクリプトIDを調べる

1. ブラウザで対象のスプレッドシートを開きます．

2. 次の順に画面を移動します．

    ```text
    スプレッドシート
      → 上のメニュー「拡張機能」
        → 「Apps Script」
          → 左側の歯車アイコン「プロジェクトの設定」
            → 「ID」の欄にある「スクリプトID」
    ```

3. 表示されているスクリプトIDをコピーします．次のような，英数字が並んだ長い文字列です．

    ```text
    例: 1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789
    ```

### 取り込む

1. 作業用のフォルダを作り，そこへ移動します．

    ```sh
    mkdir -p ~/discord_bot
    cd ~/discord_bot
    ```

    すでにこのリポジトリを `git clone` している場合は，この手順は不要です．
    クローンしたフォルダへ移動してください．

2. Gitで管理を始めます（すでにクローン済みなら不要です）．

    ```sh
    git init
    ```

3. コピーしたスクリプトIDを指定して，GASプロジェクトを取り込みます．

    ```sh
    clasp clone ここにスクリプトIDを貼り付ける
    ```

4. ファイルが取り込まれたか確認します．

    ```sh
    clasp status
    ```

    `.clasp.json` や `appsscript.json`，`.js` ファイルができていれば成功です．

> **補足**
> `.clasp.json` は「このフォルダは，どのGASプロジェクトとつながっているか」を記録した設定ファイルです．
> このリポジトリを `git clone` した場合は，`.clasp.json` が
> `ここにスクリプトIDを入れてください` というプレースホルダの状態で入っています．
> `clasp clone` を実行するとこのファイルが自分のIDで上書きされるほか，
> ファイルを直接開いて `scriptId` を書き換えても構いません．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## 5. clasp の基本操作

| やりたいこと | コマンド |
| --- | --- |
| GAS のプロジェクトをブラウザで開く | `clasp open` |
| GAS 側の最新コードをパソコンへ取り込む | `clasp pull` |
| パソコンで編集した内容を GAS へ送る | `clasp push` |
| ファイルの状態を確認する | `clasp status` |
| 別の GAS プロジェクトを取り込む | `clasp clone <スクリプトID>` |

> **注意**
> `clasp push` は，**GAS側の内容をパソコン側の内容で上書きします．**
> ブラウザのGASエディタで直接編集した内容は，`clasp push` すると消えてしまいます．
>
> 混乱を避けるため，次のどちらかに統一してください．
>
> - パソコンで編集する → 作業前に `clasp pull`，作業後に `clasp push`
> - ブラウザで編集する → `clasp push` は使わない

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## Git 管理上の注意

次の2つのファイルには，**あなた個人の情報が入ります．**

次の2つのファイルは，**プレースホルダの状態でリポジトリに含まれています．**

| ファイル | 書き込む情報 | 初期値 |
| --- | --- | --- |
| `.clasp.json` | あなたのGASプロジェクトのID | `ここにスクリプトIDを入れてください` |
| `gas/config_english.js` | Discord Webhook URL，スプレッドシートのURL | `ここに〜を入れてください` |

どちらも clone した直後から編集できるよう，あえて `.gitignore` に登録していません．
そのため **自分の値を書き込むと，その値がコミットされる状態になります．**

### 自分の値をコミットしないようにする

値を書き込んだあとGitHubなどへ push する場合は，
次のどちらかを行ってください．

```sh
# 方法1: 手元の変更をコミット対象から外す（推奨）
# ファイルはリポジトリに残しつつ，自分の編集だけ無視される
git update-index --skip-worktree .clasp.json
git update-index --skip-worktree gas/config_english.js

# 方法2: .gitignore に登録して追跡をやめる
echo ".clasp.json" >> .gitignore
echo "gas/config_english.js" >> .gitignore
git rm --cached .clasp.json gas/config_english.js
```

値を書き換えたあと，`git status` に2つのファイルが
**出てこなければ**，値がコミットされる心配はありません．

```sh
git status
```

> **方法1を元に戻したいとき**
> `git update-index --no-skip-worktree <ファイル名>` で解除できます．

> Webhook URLを誤って公開してしまった場合は，
> **Discord側でそのウェブフックを削除して作り直してください．**
> 削除するまで，URLを知っている人は誰でもそのチャンネルへ投稿できます．

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## うまくいかないとき

| 症状 | 対処 |
| --- | --- |
| `clasp: command not found` | `npm install -g @google/clasp` を実行し直す．`source ~/.bashrc` も試す |
| `volta: command not found` | `source ~/.bashrc` を実行する．それでも直らないならターミナルを開き直す |
| `clasp login` でエラーになる | [Google Apps Script API の設定画面](https://script.google.com/home/usersettings) で API がオンか確認する |
| `clasp clone` で「見つかりません」と出る | スクリプトIDが正しいか，ログイン中のアカウントがそのプロジェクトを開ける権限を持っているか確認する |
| `clasp push` でエラーになる | 先に `clasp pull` でGAS側の内容を取り込み，差分を確認してからもう一度試す |

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>

## 関連ドキュメント

| ドキュメント | 内容 |
| --- | --- |
| [はじめかた](getting_started.md) | BOTのセットアップ手順．**コードを編集しないならこちらだけでOK** |
| [README](../README.md) | 機能と設定項目のリファレンス |
| [チャンク分割ルール](chunking_rules.md) | 英文をどこで区切るかの基準 |

## 参考リンク

- [clasp - GitHub](https://github.com/google/clasp)
- [Volta - Getting Started](https://docs.volta.sh/guide/getting-started)
- [Google Apps Script 公式ドキュメント](https://developers.google.com/apps-script)

<p align="right">(<a href="#dev-env-top">上に戻る</a>)</p>
