/****************************************************
 * sample_data.gs
 * ==================================================
 * テンプレートへ書き込むサンプル学習データ
 *
 * create_english_learning_spreadsheet_template_with_sample が
 * このデータを使って記入例つきのシートを作る。
 *
 * ここに市販教材の例文を追加しないこと。
 * 以下の10文はこのリポジトリのために書き下ろしたオリジナル文。
 ****************************************************/

// [No., 英文, 日本語訳, 英語チャンク, 日本語チャンク]
const ENGLISH_LEARNING_SAMPLE_ROWS = [
  [
    1,
    "The meeting was postponed until next Friday.",
    "会議は来週の金曜日まで延期された。",
    "The meeting｜was postponed｜until next Friday",
    "会議は｜延期された｜来週の金曜日まで"
  ],
  [
    2,
    "She asked me to send the file again.",
    "彼女は私にそのファイルをもう一度送るよう頼んだ。",
    "She asked me｜to send the file｜again",
    "彼女は私に頼んだ｜そのファイルを送るよう｜もう一度"
  ],
  [
    3,
    "I have no idea why he changed his mind.",
    "なぜ彼が考えを変えたのか見当もつかない。",
    "I have no idea｜why he changed｜his mind",
    "見当もつかない｜なぜ彼が変えたのか｜自分の考えを"
  ],
  [
    4,
    "This machine is designed to save electricity.",
    "この機械は電力を節約するように設計されている。",
    "This machine｜is designed｜to save electricity",
    "この機械は｜設計されている｜電力を節約するように"
  ],
  [
    5,
    "If it rains tomorrow, we will cancel the trip.",
    "明日雨が降ったら旅行を中止します。",
    "If it rains tomorrow｜we will cancel｜the trip",
    "明日雨が降ったら｜私たちは中止する｜その旅行を"
  ],
  [
    6,
    "The report must be submitted by Monday morning.",
    "報告書は月曜の朝までに提出されなければならない。",
    "The report｜must be submitted｜by Monday morning",
    "報告書は｜提出されねばならない｜月曜の朝までに"
  ],
  [
    7,
    "He is proud of what his students achieved.",
    "彼は生徒たちが成し遂げたことを誇りに思っている。",
    "He is proud of｜what his students achieved",
    "彼は誇りに思っている｜生徒たちが成し遂げたことを"
  ],
  [
    8,
    "We should have left the house earlier.",
    "もっと早く家を出るべきだった。",
    "We should have left｜the house｜earlier",
    "出るべきだった｜家を｜もっと早く"
  ],
  [
    9,
    "The city has grown rapidly over the past decade.",
    "その都市はこの10年で急速に発展した。",
    "The city｜has grown rapidly｜over the past decade",
    "その都市は｜急速に発展した｜この10年で"
  ],
  [
    10,
    "Please let me know whether you can attend.",
    "出席できるかどうかお知らせください。",
    "Please let me know｜whether you can attend",
    "お知らせください｜出席できるかどうか"
  ]
];
