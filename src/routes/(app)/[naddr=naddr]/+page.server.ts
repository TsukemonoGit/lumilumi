// /page/[naddr]/+page.server.ts
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const { naddr } = params;

  if (naddr) {
    // 必要に応じて条件を追加
    setHeaders({
      "X-Robots-Tag": "noindex, nofollow",
    });
  }

  return { naddr };
};
