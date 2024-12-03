<script lang="ts">
  import { melt, createSelect, type SelectOption } from "@melt-ui/svelte";

  import type { Theme } from "$lib/types";
  import ThemeIcon from "./ThemeIcon.svelte";

  import { getThemeCtx, setThemeCtx } from "./themeswitch";
  import { setTheme } from "$lib/func/settings";
  import { onMount } from "svelte";

  let userPrefersMode: Theme = $state("system");
  onMount(() => {
    userPrefersMode = (localStorage?.getItem("theme") as Theme) ?? "system";
  });

  const themes: SelectOption<Theme>[] = [
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
    { value: "system", label: "System" },
  ];

  function modeToOption(mode: Theme): SelectOption<Theme> {
    return themes.find(({ value }) => value === mode) ?? themes[0];
  }

  function optionToMode(option: SelectOption<Theme>): Theme {
    return option.value;
  }

  const select = createSelect({
    positioning: { placement: "bottom", gutter: 10 },
    forceVisible: true,
    defaultSelected: modeToOption(
      (localStorage?.getItem("theme") as Theme) ?? "system"
    ),
    loop: false,
    onSelectedChange: ({ curr, next }) => {
      const definedNext = next ?? curr ?? themes[0];
      userPrefersMode = optionToMode(definedNext);
      setTheme(userPrefersMode);
      console.log(userPrefersMode);
      localStorage?.setItem("theme", userPrefersMode);
      return definedNext;
    },
  });

  setThemeCtx(select);

  const {
    elements: { trigger, menu, arrow },
    states: { open },
  } = select;

  const {
    elements: { option },
  } = getThemeCtx();
</script>

<button
  class="flex items-center h-10 w-fit px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
  aria-label="Open theme switcher"
  data-open={$open ? "" : undefined}
  use:melt={$trigger}
>
  <ThemeIcon theme={userPrefersMode} />
  <div class="mx-2">Theme Select</div>
</button>

{#if $open}
  <div
    use:melt={$menu}
    class="z-50 flex w-32 flex-col rounded-md bg-neutral-700 px-1 py-1 shadow-sm shadow-neutral-800"
  >
    <div use:melt={$arrow}></div>
    {#each themes as { value, label }}
      <button
        use:melt={$option({ value, label })}
        class="flex items-center gap-2 rounded-md
		px-2 py-1 text-neutral-400 transition-colors
		data-[highlighted]:bg-neutral-800 data-[highlighted]:text-neutral-300 data-[selected]:!text-white"
      >
        <ThemeIcon theme={value} />
        <span class="text-sm font-semibold">{label}</span>
      </button>
    {/each}
  </div>
{/if}
