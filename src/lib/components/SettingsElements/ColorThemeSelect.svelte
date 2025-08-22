<!-- ColorThemeSe.EthiopicCalendar.svelte -->
<script lang="ts">
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { setColorScheme, type ColorScheme } from "$lib/func/theme";
  import { melt, createSelect, type SelectOption } from "@melt-ui/svelte";
  import { onMount } from "svelte";

  // スキーム定義（ここだけ編集すればOK）
  const colorSchemeMeta: Record<ColorScheme, { label: string; color: string }> =
    {
      default: { label: "Orange", color: "#f38d1c" },
      blue: { label: "Blue", color: "#38a1f3" },
      gray: { label: "Gray", color: "#999" },
    };

  // 選択肢配列を自動生成
  const colorSchemes: SelectOption<ColorScheme>[] = Object.entries(
    colorSchemeMeta
  ).map(([value, { label }]) => ({
    value: value as ColorScheme,
    label,
  }));

  // value → option の対応Map
  const optionByValue = new Map(colorSchemes.map((o) => [o.value, o]));

  let currentScheme: ColorScheme = "default";

  onMount(() => {
    const stored = localStorage?.getItem(STORAGE_KEYS.COLOR_SCHEME);
    if (stored && stored in colorSchemeMeta) {
      currentScheme = stored as ColorScheme;
      setColorScheme(currentScheme);
    }
  });

  function schemeToOption(scheme: ColorScheme): SelectOption<ColorScheme> {
    return optionByValue.get(scheme) ?? colorSchemes[0];
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
    elements: { trigger, menu, arrow, option },
    states: { open },
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
          style="background-color: {colorSchemeMeta[value].color}"
        ></div>
        <span class="text-sm font-semibold">{label}</span>
      </button>
    {/each}
  </div>
{/if}
