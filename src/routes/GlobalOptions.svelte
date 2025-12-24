<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { followList, timelineFilter } from "$lib/stores/globalRunes.svelte";
  import { browser } from "$app/environment";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";

  const toggleGlobalFilter = (
    key: "excludeFollowee" | "excludeConversation"
  ) => {
    const currentGlobal = timelineFilter.global || {};
    timelineFilter.global = {
      ...currentGlobal,
      [key]: !currentGlobal[key],
    };

    if (browser) {
      try {
        localStorage.setItem(
          STORAGE_KEYS.TIMELINE_FILTER,
          JSON.stringify(timelineFilter)
        );
      } catch (error: any) {
        console.warn("Failed to save timelineFilter:", error);
      }
    }
  };
</script>

<li class="mb-2">
  <label class="label">
    <input
      type="checkbox"
      class="rounded-checkbox"
      checked={timelineFilter.global?.excludeConversation ?? false}
      onchange={() => toggleGlobalFilter("excludeConversation")}
    />
    {$_("filter.canversation.none")}
  </label>
</li>
{#if followList.get().size > 0}
  <li class="mb-2">
    <label class="label">
      <input
        type="checkbox"
        class="rounded-checkbox"
        checked={timelineFilter.global?.excludeFollowee ?? false}
        onchange={() => toggleGlobalFilter("excludeFollowee")}
      />
      {$_("filter.menu.globalExcludeFollowee")}
    </label>
  </li>
{/if}
