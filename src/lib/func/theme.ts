import { browser } from "$app/environment";
import { debugError } from "$lib/components/Debug/debug";
import { tick } from "svelte";

export type ColorScheme = "default" | "gray";
export type ThemeMode = "light" | "dark" | "system";

export function initThemeSettings() {
  if (!browser) return;
  try {
    const theme = (localStorage.getItem("theme") as ThemeMode) ?? "system";
    const scheme = getCurrentColorScheme();

    applyThemeMode(theme);
    applyColorScheme(scheme);
  } catch (error: any) {
    debugError(error);
  }
}

export async function setThemeMode(mode: ThemeMode) {
  if (!browser) return;
  localStorage.setItem("theme", mode);
  applyThemeMode(mode);
  await tick();
  // 再描画のため現在のカラースキーム再適用
  applyColorScheme(getCurrentColorScheme());
}

export function setColorScheme(scheme: ColorScheme) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME, scheme);
    applyColorScheme(scheme);
  } catch (error: any) {
    debugError(error);
  }
}

function applyThemeMode(mode: ThemeMode) {
  if (!browser) return;
  const root = document.documentElement;

  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    root.classList.toggle("dark", prefersDark);
  }
}

// どこかで現在のカラースキームを追跡する変数を用意
let currentColorSchemeClass: string | null = null;

function applyColorScheme(scheme: ColorScheme) {
  if (!browser) return;
  const root = document.documentElement;

  if (currentColorSchemeClass) {
    root.classList.remove(currentColorSchemeClass); // 以前のクラスを削除
  }

  if (scheme !== "default") {
    root.classList.add(scheme);
    currentColorSchemeClass = scheme; // 新しいクラスを設定
  } else {
    currentColorSchemeClass = null; // デフォルトの場合はクラスがない
  }
}

export async function toggleDarkMode() {
  if (!browser) return;

  const root = document.documentElement;
  const newIsDark = !root.classList.contains("dark");
  root.classList.toggle("dark", newIsDark);
  localStorage.setItem("theme", newIsDark ? "dark" : "light");
  await tick();
  // カラースキーム再適用
  applyColorScheme(getCurrentColorScheme());
}

function getCurrentColorScheme(): ColorScheme {
  if (!browser) return "default";
  try {
    return (
      (localStorage.getItem(STORAGE_KEYS.COLOR_SCHEME) as ColorScheme) ??
      "default"
    );
  } catch (error: any) {
    debugError(error);
    return "default";
  }
}
