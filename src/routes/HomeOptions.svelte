<!--HomeOption.svelte-->
<script lang="ts">
  import { createRadioGroup, melt } from "@melt-ui/svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { writable } from "svelte/store";
  import { timelineFilter } from "$lib/stores/globalRunes.svelte";

  const optionsArr = [
    ["0", `${$_("filter.canversation.all")}`],
    ["1", `${$_("filter.canversation.onlyFollowee")}`],
    ["2", `${$_("filter.canversation.none")}`],
  ];

  const selected = writable<string>(
    optionsArr[timelineFilter.get().selectCanversation][0]
  );

  const {
    elements: { root, item, hiddenInput },
    helpers: { isChecked },
  } = createRadioGroup({
    defaultValue: optionsArr[timelineFilter.get().selectCanversation][0],
    value: selected,
  });
  // $: console.log(timelineFilter.get.adaptMute);
  selected.subscribe((value) => {
    if (value !== undefined && value !== null) {
      timelineFilter.update((cur) => {
        console.log(cur);
        return { ...cur, selectCanversation: Number(value) };
      });
    }
  });
</script>

<li class="option-section">
  <div class="section-title">
    {$_("filter.menu.canversation")}
  </div>
  <div use:melt={$root} class="radio-group" aria-label="View density">
    {#each optionsArr as [index, option]}
      <div class="radio-item">
        <button
          use:melt={$item(index)}
          class="radio-button"
          id={option}
          aria-labelledby="{option}-label"
        >
          {#if $isChecked(index)}
            <div class="radio-indicator"></div>
          {/if}
        </button>
        <label for={option} id="{option}-label" class="option-label">
          {option}
        </label>
      </div>
    {/each}
    <input name="line-height" use:melt={$hiddenInput} />
  </div>
</li>

<style lang="postcss">
  header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
  /* 全体のリストスタイル */
  ul {
    list-style-type: none;
    padding-left: 0;
    margin: 0;
  }

  /* オプションセクション共通スタイル */
  .option-section {
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    background-color: theme("colors.neutral.800");
    border: 1px solid theme("colors.neutral.700");
    list-style-type: none;
  }

  .option-section:last-child {
    margin-bottom: 0;
  }

  /* セクションタイトル */
  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: theme("colors.magnum.200");
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid theme("colors.neutral.700");
  }

  /* ラジオボタングループ */
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .radio-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }

  .radio-button {
    display: grid;
    height: 18px;
    width: 18px;
    cursor: pointer;
    place-items: center;
    border-radius: 50%;
    border: 1px solid theme("colors.magnum.400");
    background-color: transparent;
    transition: background-color 0.2s;
  }

  .radio-button:hover {
    background-color: theme("colors.magnum.800");
  }

  .radio-indicator {
    height: 8px;
    width: 8px;
    border-radius: 50%;
    background-color: theme("colors.magnum.400");
  }

  /* チェックボックスグループ */
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .checkbox-item {
    padding: 4px 0;
  }

  /* 共通のラベルスタイル */
  .option-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: theme("colors.neutral.200");
    cursor: pointer;
    user-select: none;
  }

  /* チェックボックスのスタイル調整 */
  .rounded-checkbox {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .option {
    @apply absolute top-0 h-8 flex  right-8;
  }

  @media (max-width: 768px) {
    .option {
      @apply absolute top-0 h-8 flex right-0;
    }
  }
</style>
