import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
import { notifiSettings } from "$lib/stores/globalRunes.svelte";
import { NOTIFICATION_TYPES, type NotifiSettings } from "./notificationTypes";

// load or migrate (but not auto-save updates)
export function migrateNotifiSettings() {
  const raw = localStorage.getItem(STORAGE_KEYS.NOTIFI_SETTINGS);

  if (raw) {
    try {
      const notifi = JSON.parse(raw) as NotifiSettings;

      Object.assign(notifiSettings, notifi);
    } catch {
      // 壊れていたら初期化
      const settings: NotifiSettings = {
        onlyFollowee: false,
        selects: NOTIFICATION_TYPES.map((t) => t.id),
      };
      localStorage.setItem(
        STORAGE_KEYS.NOTIFI_SETTINGS,
        JSON.stringify(settings)
      );

      Object.assign(notifiSettings, settings);
    }
  } else {
    // データが無い場合 → 初期化 & 移行
    const followee = localStorage.getItem(STORAGE_KEYS.OLD_ONLY_FOLLOWEE);
    const settings: NotifiSettings = {
      onlyFollowee: followee === "true",
      selects: NOTIFICATION_TYPES.map((t) => t.id),
    };
    localStorage.setItem(
      STORAGE_KEYS.NOTIFI_SETTINGS,
      JSON.stringify(settings)
    );
    Object.assign(notifiSettings, settings);
  }

  // 既存データがあっても OLD キーが残っていれば削除のみ
  if (localStorage.getItem(STORAGE_KEYS.OLD_ONLY_FOLLOWEE) !== null) {
    localStorage.removeItem(STORAGE_KEYS.OLD_ONLY_FOLLOWEE);
  }
}

// 保存関数を追加
export function saveNotifiSettings(settings: NotifiSettings) {
  localStorage.setItem(STORAGE_KEYS.NOTIFI_SETTINGS, JSON.stringify(settings));
}
