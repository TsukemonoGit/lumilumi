import type MarkdownIt from "markdown-it";

const markdownImgPlugin = function (md: MarkdownIt) {
  md.inline.ruler.before("image", "html_img", function (state, silent) {
    const pos = state.pos;

    // 属性の順序に依存せず、任意の属性にマッチする正規表現
    const imgRegex = /<img\s+([^>]+?)\s*\/?>/i;
    const match = imgRegex.exec(state.src.slice(pos));

    if (match) {
      if (!silent) {
        const token = state.push("image", "img", 0);
        token.attrs = [];

        // 個々の属性の解析
        const attrRegex =
          /\b(alt|src|width|height|style)=["']?([^"'\s>]+)["']?/gi;
        let attrMatch;

        // 各属性をトークンに追加
        while ((attrMatch = attrRegex.exec(match[1])) !== null) {
          const attrName = attrMatch[1];
          const attrValue = attrMatch[2];
          token.attrs.push([attrName, attrValue]);
        }
      }

      // マッチした部分の長さだけ位置を進める
      state.pos += match[0].length;
      return true;
    }

    return false;
  });
};

export default markdownImgPlugin;
