<script lang="ts">
  import { RadioGroup } from "melt/builders";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { timelineFilter } from "$lib/stores/globalRunes.svelte";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { browser } from "$app/environment";
  import { untrack } from "svelte";

  const group = new RadioGroup({});

  let optionsArr = $derived([
    ["0", $_("filter.canversation.all")],
    ["1", $_("filter.canversation.onlyFollowee")],
    ["2", $_("filter.canversation.none")],
  ]);

  // runesの値をRadioGroupに同期
  $effect(() => {
    group.value = timelineFilter.selectCanversation.toString();
  });

  // RadioGroupの変更をrunesとlocalStorageに反映
  $effect(() => {
    const value = group.value;
    if (value !== undefined && value !== null) {
      untrack(() => {
        const numValue = Number(value);
        if (timelineFilter.selectCanversation !== numValue) {
          timelineFilter.selectCanversation = numValue;

          if (browser) {
            try {
              localStorage.setItem(
                STORAGE_KEYS.TIMELINE_FILTER,
                JSON.stringify(timelineFilter)
              );
            } catch (error) {
              console.warn("Failed to save timelineFilter:", error);
            }
          }
        }
      });
    }
  });
</script>

<li class="option-section">
  <div class="section-title">
    {$_("filter.menu.canversation")}
  </div>
  <div {...group.root} class="radio-group" aria-label="Conversation filter">
    {#each optionsArr as [index, option]}
      {@const item = group.getItem(index)}
      <div class="radio-item">
        <button
          {...item.attrs}
          class="radio-button"
          id="conversation-{index}"
          aria-labelledby="conversation-{index}-label"
        >
          {#if item.checked}
            <div class="radio-indicator"></div>
          {/if}
        </button>
        <label
          for="conversation-{index}"
          id="conversation-{index}-label"
          class="option-label"
        >
          {option}
        </label>
      </div>
    {/each}
    <input {...group.hiddenInput} />
  </div>
</li>

<style lang="postcss">
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

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: theme("colors.magnum.200");
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid theme("colors.neutral.700");
  }

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

  .option-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: theme("colors.neutral.200");
    cursor: pointer;
    user-select: none;
  }
</style>
