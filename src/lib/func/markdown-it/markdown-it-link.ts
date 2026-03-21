import type MarkdownIt from "markdown-it";
import type { Token } from "markdown-it/index.js";

const ALLOWED_PROTOCOLS = ["https:", "http:", "mailto:"];

function isSafeHref(href: string): boolean {
  try {
    const url = new URL(href, "https://example.com");
    return ALLOWED_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

function tokenizeInline(
  md: MarkdownIt,
  content: string,
  env: unknown,
): Token[] {
  const blockTokens = md.parseInline(content, env);
  return blockTokens[0]?.children ?? [];
}

const markdownLinkPlugin = function (md: MarkdownIt): void {
  md.inline.ruler.before("html_inline", "html_link", (state, silent) => {
    const remaining = state.src.slice(state.pos);

    const linkRegex = /^<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
    const match = linkRegex.exec(remaining);
    if (!match) return false;

    const href = match[1];
    const innerContent = match[2];

    // 不正スキームは後続ルール（html_inline）に委ねる。
    // Svelte5でinnerHTML未使用の場合、テキストとして出力されるだけで実行されない。
    if (!isSafeHref(href)) return false;

    if (!silent) {
      const tokenOpen = state.push("link_open", "a", 1);
      tokenOpen.attrSet("href", href);
      tokenOpen.markup = "autolink";
      tokenOpen.info = "auto";

      const children = tokenizeInline(md, innerContent, state.env);
      for (const child of children) {
        state.tokens.push(child);
      }

      const tokenClose = state.push("link_close", "a", -1);
      tokenClose.markup = "autolink";
    }

    state.pos += match[0].length;
    return true;
  });
};

export default markdownLinkPlugin;
