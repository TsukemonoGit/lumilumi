import markdownit from "markdown-it";
import { describe, expect, test } from "vitest";

import markdownTimestampPlugin from "./markdown-it-timestamp";

function render(source: string): string {
  return markdownit().use(markdownTimestampPlugin).render(source);
}

describe("markdown-it タイムスタンププラグイン", () => {
  test("m:ss と h:mm:ss をシークリンクに変換する", () => {
    const html = render("00:00 イントロ 1:02:03 エンディング");
    expect(html).toContain('href="#podcast-time-0"');
    expect(html).toContain('href="#podcast-time-3723"');
  });

  test("分'秒\" 形式をシークリンクに変換する", () => {
    const html = render('ゲストの話 (34\'57") から');
    expect(html).toContain('href="#podcast-time-2097"');
    expect(html).toContain("34'57&quot;");
  });

  test("h:mm'秒\" を途中で切らずに変換する", () => {
    const html = render('最後の曲 (1:01\'20") まで');
    expect(html).toContain('href="#podcast-time-3680"');
    // "1:01" だけのリンクが混ざらないこと
    expect(html).not.toContain('href="#podcast-time-61"');
  });

  test("URL 内の数字はリンク化しない", () => {
    const html = render("https://example.com/archive/1:02");
    expect(html).not.toContain("#podcast-time-");
  });

  test("既存リンクのテキストは二重リンクにしない", () => {
    const html = render("[1:02](https://example.com)");
    expect(html).not.toContain("#podcast-time-");
    expect(html).toContain('href="https://example.com"');
  });
});
