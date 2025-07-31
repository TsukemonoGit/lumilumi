// src/lib/utils/debug.ts
import { writable } from "svelte/store";

export const DEBUG_MODE =
  import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true";

export const debugLogs = writable<string[]>([]);
export const storageData = writable<Record<string, any>>({});
export const showDebug = writable(false);

export function addDebugLog(message: string, details?: any) {
  if (!DEBUG_MODE) return;
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0];

  let logMessage = `[${timestamp}] ${message}`;
  if (details !== undefined) {
    // オブジェクトならJSON文字列化、文字列ならそのまま付加
    if (typeof details === "object") {
      try {
        logMessage += `: ${JSON.stringify(details, null, 2)}`;
      } catch {
        logMessage += `: [object]`;
      }
    } else {
      logMessage += `: ${details}`;
    }
  }

  debugLogs.update((logs) => [logMessage, ...logs].slice(0, 50));

  // console.log(logMessage);
}

export function getStorageData(keys = ["timelineFilter", "lumiSetting"]) {
  if (!DEBUG_MODE) return;
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
  addDebugLog(`Storage data updated: ${Object.keys(data).length} keys`);
}

export function toggleDebug() {
  if (!DEBUG_MODE) return;
  showDebug.update((v) => {
    const next = !v;
    if (next) getStorageData();
    return next;
  });
}

export function clearStorage() {
  if (confirm("本当にすべてのローカルストレージをクリアしますか？")) {
    localStorage.clear();
    addDebugLog("LocalStorage cleared");
    getStorageData();
  }
}
