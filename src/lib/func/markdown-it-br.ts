import type MarkdownIt from "markdown-it";

const markdownBrPlugin = function (md: MarkdownIt) {
  // <br>, <br/> または <br /> を検出するルールを追加
  md.inline.ruler.before("newline", "break_token", function (state, silent) {
    var pos = state.pos;

    // <br>, <br/> または <br /> にマッチする正規表現
    const breakRegex = /^<br\s*\/?>/i;

    // 現在の位置からマッチを確認
    const match = breakRegex.exec(state.src.slice(pos));

    if (match) {
      if (!silent) {
        // 'hardbreak' トークンを追加
        state.push("hardbreak", "br", 0);
      }
      // マッチした長さだけ位置を進める
      state.pos += match[0].length;
      return true;
    }

    return false;
  });
};

export default markdownBrPlugin;
