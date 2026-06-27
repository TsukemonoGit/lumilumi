import { saveStatus } from "$lib/stores/globalRunes.svelte";

export function saveLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value);
  showSaved();
}

let timeoutId: ReturnType<typeof setTimeout> | undefined;
export function showSaved(duration = 2000) {
  saveStatus.value = true;
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    saveStatus.value = false;
  }, duration);
}
