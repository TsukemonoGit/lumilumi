function isTextFile(filePath) {
  const textExtensions = [
    ".js",
    ".ts",
    ".json",
    ".html",
    ".css",
    ".md",
    ".txt",
    ".xml",
    ".svg",
    ".csv",
    ".svelte",
  ];
  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.includes(ext);
}

function checkFile(filePath) {
  // テキストファイルのみチェック
  if (!isTextFile(filePath)) return;

  try {
    const buffer = fs.readFileSync(filePath);
    const results = [];

    // 以下は既存のチェック処理
    const bom = detectBom(buffer);
    if (bom) results.push(`BOM: ${bom}`);

    const controlChars = hasControlChars(buffer);
    if (controlChars.length > 0) {
      results.push(`Control chars: ${controlChars.length} found`);
    }

    if (!isValidUtf8(buffer)) {
      results.push("Invalid UTF-8");
    }

    if (results.length > 0) {
      console.log(`🟥 ${filePath}: ${results.join(", ")}`);
    }
  } catch (error) {
    // エラーは無視
  }
}
