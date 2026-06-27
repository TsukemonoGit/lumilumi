<!-- ColorThemeSe.EthiopicCalendar.svelte -->
<script lang="ts">
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { setColorScheme, type ColorScheme } from "$lib/func/theme";
  import { Triangle } from "lucide-svelte";
  import { onMount } from "svelte";

  // スキーム定義（ここだけ編集すればOK）
  const colorSchemeMeta: Record<ColorScheme, { label: string; color: string }> =
    {
      default: { label: "Orange", color: "#f38d1c" },
      blue: { label: "Blue", color: "#38a1f3" },
      gray: { label: "Gray", color: "#999" },
    };

  // 選択肢配列を自動生成
  const colorSchemes: { value: ColorScheme; label: string }[] = Object.entries(
    colorSchemeMeta,
  ).map(([value, { label }]) => ({
    value: value as ColorScheme,
    label,
  }));

  let currentScheme: ColorScheme = "default";
  let open = false;
  let containerEl: HTMLDivElement;

  onMount(() => {
    const stored = localStorage?.getItem(STORAGE_KEYS.COLOR_SCHEME);
    if (stored && stored in colorSchemeMeta) {
      currentScheme = stored as ColorScheme;
      setColorScheme(currentScheme);
    }

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

  function selectScheme(value: ColorScheme) {
    currentScheme = value;
    setColorScheme(value);
    localStorage?.setItem(STORAGE_KEYS.COLOR_SCHEME, value);
    open = false;
  }

  function toggleOpen() {
    open = !open;
  }
</script>

<div class="flex justify-between items-center">
  Color

  <div class="relative inline-block" bind:this={containerEl}>
    <button
      type="button"
      class="flex h-10 items-center rounded-md pl-4 pr-8 font-medium shadow w-32 bg-neutral-900 myButton"
      aria-haspopup="listbox"
      aria-expanded={open}
      onclick={toggleOpen}
    >
      {colorSchemeMeta[currentScheme].label}
      <span class="pointer-events-none absolute right-2" aria-hidden="true">
        <Triangle
          class="rotate-180 fill-magnum-500 text-magnum-500"
          size={12}
        />
      </span>
    </button>

    {#if open}
      <ul
        role="listbox"
        class="absolute right-0 z-50 mt-1 w-full min-w-max rounded-md bg-neutral-900 p-2 shadow"
        tabindex="-1"
      >
        {#each colorSchemes as { value, label }}
          <li
            role="option"
            aria-selected={value === currentScheme}
            class="flex cursor-pointer items-center gap-2 px-2 py-1 hover:bg-magnum-500/50 rounded-sm"
            style="border-right: 4px solid {colorSchemeMeta[value].color}"
            onclick={() => selectScheme(value)}
          >
            {label}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
