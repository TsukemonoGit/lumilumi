import type MarkdownIt from "markdown-it";

const markdownImgPlugin = function (md: MarkdownIt) {
  md.inline.ruler.before("image", "html_img", function (state, silent) {
    const pos = state.pos;
    const imgRegex =
      /^<img\s+src="([^"]+)"(?:\s+width="(\d+)")?(?:\s+height="(\d+)")?\s*\/?>/i;
    const match = imgRegex.exec(state.src.slice(pos));

    if (match) {
      if (!silent) {
        const token = state.push("image", "img", 0);

        // 属性をトークンの属性として設定
        token.attrs = [
          ["src", match[1]], // src 属性
        ];

        // width属性があれば追加
        if (match[2]) {
          token.attrs.push(["width", match[2]]);
        }

        // height属性があれば追加
        if (match[3]) {
          token.attrs.push(["height", match[3]]);
        }
      }

      state.pos += match[0].length;
      return true;
    }

    return false;
  });
};

export default markdownImgPlugin;
