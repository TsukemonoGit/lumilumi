import type MarkdownIt from "markdown-it";

const markdownDdPlugin = function (md: MarkdownIt) {
  md.inline.ruler.before("text", "dl", (state, silent) => {
    const pos = state.pos;
    // リンクの正規表現に改行や空白を許容
    const linkRegex = /^<dd\s*>([\s\S]*?)<\/dd>/i;

    const match = linkRegex.exec(state.src.slice(pos));
    if (match) {
      if (!silent) {
        const content = match[1]; //リンク内コンテンツ（HTMLも含む）

        // リンク開始のトークンを生成
        state.push("dd_open", "dd", 1);

        // リンク内のコンテンツを再帰的にパース
        parseHtmlContent(content, state);

        // リンク閉じのトークンを生成
        state.push("dd_close", "dd", -1);
      }

      // マッチした長さだけ位置を進める
      state.pos += match[0].length;
      return true;
    }

    return false;
  });

  // 任意のHTMLコンテンツをパースする関数
  function parseHtmlContent(content: string, state: any) {
    const tempState = new state.md.inline.State(
      content,
      state.md,
      state.env,
      [],
    );
    tempState.md.inline.tokenize(tempState);

    // 子トークンを親のトークンに追加
    state.tokens.push(...tempState.tokens);
  }
};

export default markdownDdPlugin;
