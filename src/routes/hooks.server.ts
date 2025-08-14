import { setLocale } from "@konemono/svelte5-i18n";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const lang = event.request.headers.get("accept-language")?.split(",")[0];
  if (lang) {
    setLocale(lang);
  }
  return resolve(event);
};
