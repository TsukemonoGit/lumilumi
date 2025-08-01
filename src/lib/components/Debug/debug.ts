// src/lib/utils/debug.ts

import { writable } from "svelte/store";

export const DEBUG_MODE =
  import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true";

export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

// DEBUG_MODEの値で初期化
export const debug = writable(DEBUG_MODE);

export interface DebugLog {
  message: string;
  level: LogLevel;
  timestamp: string;
  details?: any;
}

export const debugLogs = writable<DebugLog[]>([]);
export const storageData = writable<Record<string, any>>({});
export const showDebug = writable(false);

export function addDebugLog(
  message: string,
  details?: any,
  level: LogLevel = "info"
) {
  // debug ストアの値をチェック
  let debugEnabled = false;
  debug.subscribe((value) => (debugEnabled = value))();

  if (!debugEnabled) return;

  const timestamp = new Date().toISOString().split("T")[1].split(".")[0];

  const log: DebugLog = {
    message,
    level,
    timestamp,
    details,
  };

  debugLogs.update((logs) => [log, ...logs].slice(0, 50));
}

export function getStorageData(keys = ["timelineFilter", "lumiSetting"]) {
  let debugEnabled = false;
  debug.subscribe((value) => (debugEnabled = value))();

  if (!debugEnabled) return;

  const data: Record<string, any> = {};

  keys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      data[key] = value ? JSON.parse(value) : null;
    } catch {
      data[key] = null;
    }
  });

  storageData.set(data);
  debugSuccess(`Storage data updated: ${Object.keys(data).length} keys`, data);
}

export function toggleDebug() {
  let debugEnabled = false;
  debug.subscribe((value) => (debugEnabled = value))();

  if (!debugEnabled) return;

  showDebug.update((v) => {
    const next = !v;
    if (next) getStorageData();
    return next;
  });
}

export function clearStorage() {
  if (confirm("本当にすべてのローカルストレージをクリアしますか？")) {
    localStorage.clear();
    debugWarn("LocalStorage cleared");
    getStorageData();
  }
}

// 便利な関数を追加
export const debugInfo = (message: string, details?: any) =>
  addDebugLog(message, details, "info");
export const debugWarn = (message: string, details?: any) =>
  addDebugLog(message, details, "warn");
export const debugError = (message: string, details?: any) =>
  addDebugLog(message, details, "error");
export const debugSuccess = (message: string, details?: any) =>
  addDebugLog(message, details, "success");
export const debugLog = (message: string, details?: any) =>
  addDebugLog(message, details, "debug");
