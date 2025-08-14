// src/lib/i18n/index.ts

import { initI18n, registerLocale } from "@konemono/svelte5-i18n";

const defaultLocale = "en";
try {
  // 動的インポート方式で言語ファイルを登録
  registerLocale("ja", () => import("./locales/ja.json"));
  registerLocale("en", () => import("./locales/en.json"));

  initI18n({
    defaultLocale: defaultLocale,
    supportedLocales: ["ja", "en"],
  });
} catch (error: any) {}
