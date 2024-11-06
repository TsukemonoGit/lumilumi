import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ setHeaders }) => {
  setHeaders({
    "X-Robots-Tag": "noindex, nofollow",
  });

  return {}; // 必要なデータがない場合は空オブジェクトを返す
};
