import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ setHeaders }) => {
  setHeaders({
    "X-Robots-Tag": "noindex, nofollow",
  });

  return {};
};
