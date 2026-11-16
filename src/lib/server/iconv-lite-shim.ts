// Minimal iconv-lite replacement for Cloudflare Workers.
// unfurl.js only uses `decode(buffer, charset).toString()`, so the streaming
// and Node Buffer extensions from iconv-lite are unnecessary (and break the
// Worker bundle because they rely on CJS `require("./streams")`).
const LABELS: Record<string, string> = {
  CP932: "shift_jis",
  SHIFTJIS: "shift_jis",
  SJIS: "shift_jis",
  WINDOWS31J: "shift_jis",
  CP936: "gbk",
  GBK: "gbk",
  GB2312: "gbk",
  GB18030: "gb18030",
  CP949: "euc-kr",
  EUCKR: "euc-kr",
  CP950: "big5",
  BIG5: "big5",
  EUCJP: "euc-jp",
};

export function decode(
  buffer: Uint8Array,
  encoding: string,
): { toString(): string } {
  const key = encoding.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const label = LABELS[key] ?? "utf-8";

  try {
    const text = new TextDecoder(label).decode(buffer);
    return { toString: () => text };
  } catch {
    const text = new TextDecoder().decode(buffer);
    return { toString: () => text };
  }
}
