/****************************************************
 * sample_data.gs
 * ==================================================
 * 動作確認用のサンプルペイロード
 *
 * HF 設定画面の Activity タブから本物をコピーして貼り替えてよい。
 ****************************************************/

// push（リポジトリ更新）のサンプル。
// commits API の確認もできるよう，実在する public リポジトリにしてある。
const SAMPLE_HUGGINGFACE_PUSH_PAYLOAD = {
  event: {
    action: "update",
    scope: "repo.content"
  },
  repo: {
    type: "model",
    name: "openai-community/gpt2",
    id: "621ffdc036468d709f17434d",
    private: false,
    url: {
      web: "https://huggingface.co/openai-community/gpt2",
      api: "https://huggingface.co/api/models/openai-community/gpt2"
    },
    headSha: "607a30d783dfa663caf39e06633721c8d4cfcd7e",
    owner: {
      id: "628b753283ef59b5be89e937"
    }
  },
  updatedRefs: [
    {
      ref: "refs/heads/main",
      oldSha: "11c5a3d5811f50298f278a704980280950aedb10",
      newSha: "607a30d783dfa663caf39e06633721c8d4cfcd7e"
    }
  ],
  webhook: {
    id: "6390e855e30d9209411de93b",
    version: 3
  }
};
