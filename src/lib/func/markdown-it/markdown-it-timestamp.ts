import type { MarkdownIt, Token } from "markdown-it";
import { timestampToSeconds } from "#lib/func/podcast.ts";

// ショーノート中のタイムスタンプ（00:00 / 1:02:03 / 12'34" / 1:01'20"）を
// プレイヤーでシークできるリンクに変換する markdown-it プラグイン。
// リンク先は "#podcast-time-<秒>" とし、クリックは PodcastShowNotes 側で処理する。
const TIMESTAMP_RE =
  /(?<![\w:/])(?:\d{1,2}:\d{2}'\d{2}["”″]?|\d{1,2}:\d{2}:\d{2}|\d{1,2}'\d{2}["”″]?|\d{1,2}:\d{2})(?![\w:'])/g;

const markdownTimestampPlugin = function (md: MarkdownIt): void {
  md.core.ruler.push("podcast_timestamps", (state) => {
    const TokenCtor = state.Token;

    const createText = (content: string, level: number): Token => {
      const token = new TokenCtor("text", "", 0);
      token.content = content;
      token.level = level;
      return token;
    };

    const createTimestampLink = (
      timestamp: string,
      level: number,
    ): Token[] => {
      const seconds = timestampToSeconds(timestamp);
      if (!Number.isFinite(seconds)) return [createText(timestamp, level)];

      const open = new TokenCtor("link_open", "a", 1);
      open.attrs = [["href", `#podcast-time-${seconds}`]];
      open.level = level;
      open.markup = "podcast";

      const text = createText(timestamp, level);
      text.level = level + 1;

      const close = new TokenCtor("link_close", "a", -1);
      close.level = level;
      close.markup = "podcast";

      return [open, text, close];
    };

    const transformText = (token: Token): Token[] => {
      const content = token.content;
      if (!content) return [token];

      const result: Token[] = [];
      let lastIndex = 0;
      for (const match of content.matchAll(TIMESTAMP_RE)) {
        const start = match.index ?? 0;
        if (start > lastIndex) {
          result.push(createText(content.slice(lastIndex, start), token.level));
        }
        result.push(...createTimestampLink(match[0], token.level));
        lastIndex = start + match[0].length;
      }
      if (result.length === 0) return [token];
      if (lastIndex < content.length) {
        result.push(createText(content.slice(lastIndex), token.level));
      }
      return result;
    };

    const processChildren = (tokens: Token[]): Token[] => {
      const result: Token[] = [];
      let linkDepth = 0;
      for (const token of tokens) {
        if (token.type === "link_open") linkDepth++;
        if (token.type === "link_close") linkDepth = Math.max(0, linkDepth - 1);

        // 既存リンク内のテキストは二重リンクにしない
        if (token.type === "text" && linkDepth === 0) {
          result.push(...transformText(token));
        } else {
          result.push(token);
        }
      }
      return result;
    };

    for (const token of state.tokens) {
      if (token.type === "inline" && token.children) {
        token.children = processChildren(token.children);
      }
    }
  });
};

export default markdownTimestampPlugin;
