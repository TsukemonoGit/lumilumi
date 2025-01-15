import { unfurl as originalUnfurl } from "unfurl.js";
import { URL } from "node:url"; // node:url モジュールを使う

// unfurl.js のラッパー関数
export const unfurl = (url: string) => {
  const validUrl = new URL(url); // URL を解析して検証する
  return originalUnfurl(validUrl.toString()); // 正規化されたURLを unfurl.js に渡す
};
