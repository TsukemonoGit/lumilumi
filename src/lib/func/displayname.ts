import type { Part } from "./content";

export function parseEmojiText(name: string, emojiTags: string[][]): Part[] {
  const parts: Part[] = [];
  const emojiMap = new Map(
    emojiTags.map(([_, shortcode, url]) => [shortcode, url])
  );

  // 正規表現で :shortcode: 形式を検出し、処理を分割
  const emojiRegex = /:([a-zA-Z0-9_]+):/g;
  let lastIndex = 0;

  name.replace(emojiRegex, (match, shortcode, index) => {
    // 前のテキスト部分を追加
    if (lastIndex < index) {
      parts.push({ type: "text", content: name.slice(lastIndex, index) });
    }

    // エモジが見つかれば追加、なければテキストとして扱う
    const url = emojiMap.get(shortcode);
    if (url) {
      parts.push({ type: "emoji", content: shortcode, url });
    } else {
      parts.push({ type: "text", content: match });
    }

    lastIndex = index + match.length;
    return match; // replaceのコールバックは何も変換しないため、matchをそのまま返す
  });

  // 残りのテキスト部分を追加
  if (lastIndex < name.length) {
    parts.push({ type: "text", content: name.slice(lastIndex) });
  }

  return parts;
}
