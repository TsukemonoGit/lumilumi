import { queryClient } from "$lib/stores/stores";
import type { Theme, ToastData } from "$lib/types";
import type { QueryKey } from "@tanstack/svelte-query";
import { get } from "svelte/store";

export function setTheme(theme: Theme) {
  if (
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function getMutelist(pubkey: string) {
  const defaultRelay = get(queryClient).getQueryData([
    "defaultRelay",
    pubkey,
  ] as QueryKey);
  console.log(defaultRelay);
}
