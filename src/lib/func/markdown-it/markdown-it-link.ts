import type MarkdownIt from "markdown-it";

const markdownLinkPlugin = function (md: MarkdownIt) {
  md.inline.ruler.before("text", "html_link", (state, silent) => {
    const pos = state.pos;
    // リンクの正規表現に改行や空白を許容
    const linkRegex = /^<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i;

    const match = linkRegex.exec(state.src.slice(pos));
    if (match) {
      if (!silent) {
        const href = match[1]; // リンク先URL
        const content = match[2]; // リンク内コンテンツ（HTMLも含む）

        // リンク開始のトークンを生成
        const tokenOpen = state.push("link_open", "a", 1);
        tokenOpen.attrs = [["href", href]];

        // リンク内のコンテンツを再帰的にパース
        parseHtmlContent(content, state);

        // リンク閉じのトークンを生成
        state.push("link_close", "a", -1);
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
      []
    );
    tempState.md.inline.tokenize(tempState);

    // 子トークンを親のトークンに追加
    state.tokens.push(...tempState.tokens);
  }
};

export default markdownLinkPlugin;
