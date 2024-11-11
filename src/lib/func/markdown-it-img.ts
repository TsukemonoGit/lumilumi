import type MarkdownIt from "markdown-it";

const parseImgAttributes = (imgTag: string) => {
  const attributes: [string, string][] = [];
  const attrRegex = /\b(alt|src|width|height|style)=["']?([^"'>]+)["']?/gi;
  let attrMatch;

  while ((attrMatch = attrRegex.exec(imgTag)) !== null) {
    attributes.push([attrMatch[1], attrMatch[2]]);
  }

  return attributes;
};

const markdownImgPlugin = function (md: MarkdownIt) {
  md.inline.ruler.before("image", "html_img", function (state, silent) {
    const pos = state.pos;

    // <img> タグ全体にマッチする正規表現
    const imgRegex = /^<img\s+[^>]+\/?>/i;
    const match = imgRegex.exec(state.src.slice(pos));

    if (match) {
      if (!silent) {
        const token = state.push("image", "img", 0);
        token.attrs = parseImgAttributes(match[0]);
      }

      // 正しい位置に進める
      state.pos += match[0].length;
      return true;
    }

    return false;
  });
};

export default markdownImgPlugin;
