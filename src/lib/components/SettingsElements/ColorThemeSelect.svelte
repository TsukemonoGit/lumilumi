<!--ColorThemeSe.EthiopicCalendar.svelte-->

<script lang="ts">
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { setColorScheme, type ColorScheme } from "$lib/func/theme";
  import { melt, createSelect, type SelectOption } from "@melt-ui/svelte";
  import { onMount } from "svelte";

  // カラースキームの型定義

  // 選択候補
  const colorSchemes: SelectOption<ColorScheme>[] = [
    { value: "default", label: "Orange" },
    { value: "gray", label: "Gray" },
  ];

  // 保存されたスキームを取得
  let currentScheme: ColorScheme = "default";

  onMount(() => {
    const stored = localStorage?.getItem(STORAGE_KEYS.COLOR_SCHEME);
    if (stored === "default" || stored === "gray") {
      currentScheme = stored;
    }
  });

  function schemeToOption(scheme: ColorScheme): SelectOption<ColorScheme> {
    return (
      colorSchemes.find(({ value }) => value === scheme) ?? colorSchemes[0]
    );
  }

  function optionToScheme(option: SelectOption<ColorScheme>): ColorScheme {
    return option.value;
  }

  const select = createSelect({
    positioning: { placement: "bottom", gutter: 10 },
    forceVisible: true,
    defaultSelected: schemeToOption(currentScheme),
    loop: false,
    onSelectedChange: ({ curr, next }) => {
      const selected = optionToScheme(next ?? curr ?? colorSchemes[0]);
      currentScheme = selected;
      setColorScheme(selected);
      localStorage?.setItem(STORAGE_KEYS.COLOR_SCHEME, selected);
      return schemeToOption(selected);
    },
  });

  const {
    elements: { trigger, menu, arrow },
    states: { open },
  } = select;

  const {
    elements: { option },
  } = select;
</script>

<button
  class="flex items-center h-10 w-fit px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
  aria-label="Open color scheme switcher"
  data-open={$open ? "" : undefined}
  use:melt={$trigger}
>
  🎨
  <div class="mx-2">Color Theme</div>
</button>

{#if $open}
  <div
    use:melt={$menu}
    class="z-50 flex w-40 flex-col rounded-md bg-neutral-700 px-1 py-1 shadow-sm shadow-neutral-800"
  >
    <div use:melt={$arrow}></div>
    {#each colorSchemes as { value, label }}
      <button
        use:melt={$option({ value, label })}
        class="flex items-center gap-2 rounded-md
        px-2 py-1 text-neutral-400 transition-colors
        data-[highlighted]:bg-neutral-800 data-[highlighted]:text-neutral-300 data-[selected]:!text-white"
      >
        <div
          class="w-3 h-3 rounded-full"
          style="background-color: {value === 'default' ? '#f38d1c' : '#999'}"
        ></div>
        <span class="text-sm font-semibold">{label}</span>
      </button>
    {/each}
  </div>
{/if}
