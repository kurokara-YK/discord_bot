# チャンク分割ルール

英文を「意味のまとまり（チャンク）」へ分割するときの基準をまとめた文書です．

> このBOTの使い方は [はじめかた](getting_started.md)，
> 設定項目の一覧は [README](../README.md) を参照してください．

スプレッドシートへデータを追加するときに**同じ基準を使う**ことを目的にしています．
基準を明文化しないと，作成する時期によって粒度がばらつき，
あとからそろえ直すのが極めて困難になります．

---

## 目的

チャンク分割には2つの役割があります．

1. **語順のまま理解する訓練** — 英語を後ろから訳し上げず，前から意味を取る
2. **意味を部分的に確認する単位** — Discord 上でチャンクごとにGoogle翻訳で確認する

2つ目が粒度に効いてきます．細かすぎるチャンクはスマートフォンでタップできません．

---

## ルール一覧

| ルール | 例 |
| --- | --- |
| 主語部はまとめて1チャンクにする | `The meeting` |
| 動詞は助動詞・受動態を含めて1チャンクにする | `was postponed` / `must be submitted` |
| 目的語は1チャンクにする | `the trip` |
| 前置詞は必ず後続と結合する | `until next Friday` / `by Monday morning` |
| 関係詞・接続詞は節の先頭で区切る | `whether you can attend` |
| to 不定詞は独立させる | `to save electricity` |
| 冠詞・所有格は名詞から切り離さない | `his mind` |
| **1チャンクは最大4語まで** | 超えたら分割を再検討する |
| **1〜4文字の単独チャンクを作らない** | `We ｜ must` → `We must respect` |

### 最後の2つが重要

**上限4語**は，長すぎるチャンクが「意味のまとまり」として機能しないためです．

**1〜4文字の単独チャンクを作らない**のは，タップ性のための条件です．
Discord では各チャンクがリンクになっており，指でタップして意味を確認します．
`We` や `tips` のような短い語は**タップ領域が小さすぎて押せません**．
短くなる場合は前後と結合してください．学習単位としても適切な粗さに寄ります．

---

## 日本語チャンクの書き方

日本語チャンクは**英語の語順に沿って**並べます．

訳文として自然な日本語にしないでください．語順訓練の効果が失われます．

```text
英文:     The report must be submitted by Monday morning.
自然な訳:  報告書は月曜の朝までに提出されなければならない。

英語チャンク:   The report ｜ must be submitted ｜ by Monday morning
日本語チャンク:  報告書は ｜ 提出されねばならない ｜ 月曜の朝までに
```

日本語チャンクは英語チャンクと**同じ個数・同じ並び順**にします．
Discord 上では上下に並べて表示されるため，左から数えた位置で対応が取れます．

---

## 分割例

### 受動態

```text
The meeting was postponed until next Friday.
会議は来週の金曜日まで延期された。

The meeting ｜ was postponed ｜ until next Friday
会議は ｜ 延期された ｜ 来週の金曜日まで
```

### 不定詞

```text
This machine is designed to save electricity.
この機械は電力を節約するように設計されている。

This machine ｜ is designed ｜ to save electricity
この機械は ｜ 設計されている ｜ 電力を節約するように
```

### 関係詞・疑問詞節

```text
I have no idea why he changed his mind.
なぜ彼が考えを変えたのか見当もつかない。

I have no idea ｜ why he changed ｜ his mind
見当もつかない ｜ なぜ彼が変えたのか ｜ 自分の考えを
```

### 接続詞節

```text
Please let me know whether you can attend.
出席できるかどうかお知らせください。

Please let me know ｜ whether you can attend
お知らせください ｜ 出席できるかどうか
```

### 助動詞 + 完了形

```text
We should have left the house earlier.
もっと早く家を出るべきだった。

We should have left ｜ the house ｜ earlier
出るべきだった ｜ 家を ｜ もっと早く
```

---

## よくある失敗

### 細かく割りすぎる

```text
✕ We ｜ must ｜ respect ｜ the will ｜ of the individual
○ We must respect ｜ the will ｜ of the individual
```

`We` は2文字なのでタップできません．動詞とまとめます．

### 前置詞を切り離す

```text
✕ over ｜ the past decade
○ over the past decade
```

前置詞は単独で意味を持たないため，必ず後続と結合します．

### 日本語を自然な訳文にしてしまう

```text
英語チャンク:   The city ｜ has grown rapidly ｜ over the past decade
✕ 日本語チャンク: その都市はこの10年で急速に発展した
○ 日本語チャンク: その都市は ｜ 急速に発展した ｜ この10年で
```

個数が合わないと対応が取れなくなります．

---

## 長い節はさらに分割する

関係詞節や接続詞節は，節の先頭で切っただけでは 4 語を超えることがあります．
**節の中も 4 語以下になるまで割ってください．**

```text
✕ which combines prose with his gift for poetry   ← 8語
○ which combines prose ｜ with his gift ｜ for poetry
  それは散文を組み合わせる ｜ 彼の才能と ｜ 詩の
```

```text
✕ A woman passed by me   ← 5語
○ A woman ｜ passed by me
  一人の女性が ｜ 私のそばを通り過ぎた
```

主語と動詞をまとめると 5 語を超えやすいので，その場合は主語だけを切り出します．

---

## 関連ドキュメント

| ドキュメント | 内容 |
| --- | --- |
| [はじめかた](getting_started.md) | セットアップ手順．学習データの入力は「手順6」 |
| [README](../README.md) | 機能と設定項目のリファレンス |
| [開発環境の準備](development_environment.md) | claspを使ってコードを編集したい人向け |
