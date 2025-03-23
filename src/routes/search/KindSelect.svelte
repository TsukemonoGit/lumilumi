<script lang="ts">
  import { eventKinds } from "$lib/func/kinds";
  import { Combobox } from "melt/builders";
  import { ChevronDown } from "lucide-svelte";
  import { locale } from "svelte-i18n";
  import { fly } from "svelte/transition";

  interface Props {
    selectedKind?: number | undefined;
  }

  let { selectedKind = $bindable(undefined) }: Props = $props();

  // 選択肢の値を文字列として扱う
  const kindOptions = Array.from(eventKinds.entries()).map(
    ([kind, { ja, en }]) => ({
      value: kind.toString(), // 文字列に変換
      label: $locale === "ja" ? ja : en,
      originalKind: kind, // 元の値を保持
    })
  );

  // 文字列の配列として選択肢の値だけを抽出
  const options = kindOptions.map((option) => option.value);
  type Option = (typeof options)[number];

  const combobox = new Combobox<Option>({
    onValueChange: (value) => {
      if (!value) return;
      selectedKind = Number(value); // 文字列から数値に変換
    },
  });

  // 検索フィルタリング
  const filtered = $derived.by(() => {
    if (!combobox.touched) return options;
    return options.filter((o) =>
      o.toLowerCase().includes(combobox.inputValue.trim().toLowerCase())
    );
  });

  // 表示用にラベルを取得する関数
  function getLabel(value: string) {
    const option = kindOptions.find((o) => o.value === value);
    return option ? option.label : value;
  }
</script>

<div class="border border-magnum-400/60 flex gap-1 items-center rounded-md">
  <input {...combobox.input} placeholder="1" />
  <button type="button" {...combobox.trigger}>
    <ChevronDown />
  </button>

  <div {...combobox.content}>
    {#if combobox.open}
      <div transition:fly={{ duration: 150, y: -10 }}>
        {#each filtered as value (value)}
          <div {...combobox.getOption(value)}>
            {Number(value)}
            {getLabel(value)}
            {#if combobox.isSelected(value)}
              ✓
            {/if}
          </div>
        {:else}
          <span>No results found</span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  [data-melt-combobox-input] {
    width: 8em;
    margin: 0.25em;
    overflow: hidden;
    height: 2rem;
    padding: 0.25em;
    background-color: rgb(var(--color-neutral-900) / 1);
  }
  [data-melt-combobox-trigger] {
    width: 2em;
    color: theme("colors.magnum.500");
  }
  [data-melt-combobox-content] {
    color: theme("colors.neutral.200");
    background-color: theme("colors.neutral.800");
    width: max-content !important;
    height: 70%;
    overflow-y: auto;
  }
</style>
