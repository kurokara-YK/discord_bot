<a name="readme-top"></a>

# Discord Bot

<!-- 目次 -->
<details>
  <summary>目次</summary>
  <ol>
    <li><a href="#概要">概要</a></li>
    <li>
      <a href="#セットアップ">セットアップ</a>
      <ul>
        <li><a href="#環境条件">環境条件</a></li>
        <li><a href="#nodejsとnpmのインストール">Node.jsとnpmのインストール</a></li>
        <li><a href="#claspのインストール">claspのインストール</a></li>
        <li><a href="#googleアカウントへのログイン">Googleアカウントへのログイン</a></li>
        <li><a href="#gasプロジェクトの取得">GASプロジェクトの取得</a></li>
      </ul>
    </li>
    <li><a href="#基本操作">基本操作</a></li>
    <li><a href="#git管理上の注意">Git管理上の注意</a></li>
  </ol>
</details>

<!-- レポジトリの概要 -->
## 概要

このリポジトリでは，[clasp](https://github.com/google/clasp)を使ってGoogle Apps Script（GAS）のコードを編集・管理します．

GASは，Googleが提供しているクラウド上のJavaScript実行環境です．スプレッドシート，Googleフォーム，GmailなどのGoogleサービスと連携した処理を作成できます．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

<!-- セットアップ -->
## セットアップ

ここでは，Ubuntu 24.04でGASプロジェクトをローカルに取得するまでの手順を説明します．

### 環境条件

| System | Version |
| --- | --- |
| Ubuntu | 24.04 |
| Node.js | 22.0.0以上 |

補足: claspを使うにはNode.jsが必要です．本手順では，[Volta](https://docs.volta.sh/guide/getting-started)を使ってNode.jsとnpmをインストールします．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

### Node.jsとnpmのインストール

Node.jsは，JavaScriptをローカルPC上で実行するための環境です．npmは，Node.js向けのパッケージ管理ツールです．ここではnpmを使ってclaspをインストールします．

Voltaは，Node.jsやnpmのバージョンを管理するためのツールです．複数のNode.js環境を扱う場合でも，バージョンを切り替えやすくなります．

1. パッケージ一覧を更新し，必要なコマンドをインストールします．
    ```sh
    sudo apt update
    sudo apt install -y curl git
    ```

2. Voltaをインストールします．
    ```sh
    curl https://get.volta.sh | bash
    ```

3. シェルの設定を反映します．
    ```sh
    source ~/.bashrc
    ```

4. Voltaのバージョンを確認します．
    ```sh
    volta --version
    ```

5. 最新のLTS版Node.jsをインストールします．npmも一緒にインストールされます．
    ```sh
    volta install node
    ```

6. Node.jsとnpmのバージョンを確認します．
    ```sh
    node --version
    npm --version
    ```

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

### claspのインストール

claspは，GASプロジェクトをローカルPCから操作するためのコマンドラインツールです．GAS側のコードをローカルへ取得したり，ローカルで編集したコードをGAS側へ反映したりできます．

1. claspをグローバルにインストールします．
    ```sh
    npm install -g @google/clasp
    ```

2. claspのバージョンを確認します．
    ```sh
    clasp --version
    ```

3. [Google Apps Script APIの設定画面](https://script.google.com/home/usersettings)を開き，Google Apps Script APIを有効にします．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

### Googleアカウントへのログイン

1. 普段GASを編集しているGoogleアカウントでログインします．
    ```sh
    clasp login
    ```

2. ブラウザが開いたら，対象のGoogleアカウントを選択してアクセスを許可します．ブラウザが自動で開かない場合は，ターミナルに表示されたURLをブラウザに貼り付けてください．確認画面が表示された場合は，内容を確認して「続行」を押します．

    ![claspのGoogleアカウント追加アクセス確認画面](docs/images/clasp-login-continue.png)

3. ログイン後，ホームディレクトリに認証情報ファイルが作成されたことを確認します．
    ```sh
    ls -la ~ | grep clasprc
    ```

注意: `~/.clasprc.json`にはGoogleアカウントの認証情報が保存されます．他人に共有したり，Gitで管理したりしないでください．削除した場合は，`clasp login`を再実行してログインし直す必要があります．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

### GASプロジェクトの取得

1. 対象のスプレッドシートをブラウザで開き，次の順に画面を移動します．

    ```text
    スプレッドシート
    → 拡張機能
    → Apps Script
    → 左側の歯車「プロジェクトの設定」
    → スクリプトID
    ```

2. プロジェクト設定画面の「ID」欄にある「スクリプトID」をコピーします．

    ![Apps Scriptのプロジェクト設定に表示されているスクリプトID](docs/images/apps-script-script-id.png)

    ```text
    例: 1YMZvDwcXXXXXXXXXXXXXXXXXXXX
    ```

3. ローカルに作業用ディレクトリを作成し，Gitリポジトリとして初期化します．すでにこのリポジトリを取得済みの場合は，この手順を省略してください．
    ```sh
    cd ~/colcon_ws/src
    mkdir discord_bot
    cd discord_bot
    git init
    ```

4. コピーしたスクリプトIDを指定して，GASプロジェクトを取得します．
    ```sh
    clasp clone 1YMZvDwcXXXXXXXXXXXXXXXXXXXX
    ```

5. `.clasp.json`，`appsscript.json`，スクリプトファイルなどが作成されたことを確認します．
    ```sh
    clasp status
    ```

補足: `.clasp.json`は，ローカルディレクトリとGASプロジェクトを紐づける設定ファイルです．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

<!-- 実行・操作方法 -->
## 基本操作

| 操作 | コマンド |
| --- | --- |
| GAS側のプロジェクトをブラウザで開く | `clasp open` |
| GAS側の最新コードをローカルへ取得する | `clasp pull` |
| ローカルで編集した内容をGAS側へ反映する | `clasp push` |
| ファイルの状態を確認する | `clasp status` |
| GASプロジェクトをローカルへ取得する | `clasp clone <スクリプトID>` |

注意: `clasp push`はGAS側のプロジェクト内容をローカルの内容で置き換えます．実行前に変更内容を確認してください．

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## Git管理上の注意

`.clasp.json`をGitの管理対象から除外します．

```sh
echo ".clasp.json" >> .gitignore
git add .gitignore
```

`git status`で`.clasp.json`がGitの管理対象に含まれていないことを確認してください．

```sh
git status
```

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>

## 参考リンク

- [clasp - GitHub](https://github.com/google/clasp)
- [Volta - Getting Started](https://docs.volta.sh/guide/getting-started)

<p align="right">(<a href="#readme-top">上に戻る</a>)</p>
