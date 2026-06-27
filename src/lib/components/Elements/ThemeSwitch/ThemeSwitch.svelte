<script lang="ts">
  import type { Theme } from "$lib/types";
  import ThemeIcon from "./ThemeIcon.svelte";

  import { setTheme } from "$lib/func/settings";
  import { onMount } from "svelte";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { saveLocalStorage } from "$lib/func/storage";

  let userPrefersMode: Theme = $state("system");
  let open = $state(false);
  let containerEl: HTMLDivElement;

  onMount(() => {
    userPrefersMode =
      (localStorage?.getItem(STORAGE_KEYS.THEME) as Theme) ?? "system";

    function handleOutsideClick(e: MouseEvent) {
      if (containerEl && !containerEl.contains(e.target as Node)) {
        open = false;
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") open = false;
    }
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  });

  const themes: { value: Theme; label: string }[] = [
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
    { value: "system", label: "System" },
  ];

  function selectMode(mode: Theme) {
    userPrefersMode = mode;
    setTheme(mode);
    console.log(userPrefersMode);
    saveLocalStorage(STORAGE_KEYS.THEME, mode);
    open = false;
  }

  function toggleOpen() {
    open = !open;
  }
  function currentLabel(mode: Theme): string {
    return themes.find((t) => t.value === mode)?.label ?? themes[0].label;
  }
</script>

<div class="flex justify-between items-center">
  Dark or Light

  <div class="relative inline-block" bind:this={containerEl}>
    <button
      type="button"
      class="flex h-10 items-center rounded-md px-2 font-medium shadow w-32 myButton justify-between bg-neutral-900"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label="Open theme switcher"
      onclick={toggleOpen}
    >
      <div>{currentLabel(userPrefersMode)}</div>
      <ThemeIcon theme={userPrefersMode} />
    </button>

    {#if open}
      <ul
        role="listbox"
        class="absolute right-0 z-50 mt-1 w-full min-w-max rounded-md bg-neutral-900 p-2 shadow"
        tabindex="-1"
      >
        {#each themes as { value, label }}
          <li
            role="option"
            aria-selected={value === userPrefersMode}
            class="flex cursor-pointer items-center gap-2 px-2 py-1 hover:bg-magnum-700/50 rounded-sm justify-between"
            onclick={() => selectMode(value)}
          >
            <span class="text-sm font-semibold">{label}</span>
            <ThemeIcon theme={value} />
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
