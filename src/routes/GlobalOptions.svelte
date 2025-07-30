<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { followList, timelineFilter } from "$lib/stores/globalRunes.svelte";
  import { browser } from "$app/environment";

  const onChangeExcludeFollowee = () => {
    timelineFilter.update((cur) => {
      const currentGlobal = cur?.global || {};
      const tlFilter = {
        ...cur,
        global: {
          ...currentGlobal,
          excludeFollowee: !currentGlobal.excludeFollowee,
        },
      };
      try {
        if (browser) {
          localStorage.setItem("timelineFilter", JSON.stringify(tlFilter));
        }
      } catch (error: any) {
        console.warn("Failed to save timelineFilter:", error);
      }
      return tlFilter;
    });
  };

  const onChangeExcludeConversation = () => {
    timelineFilter.update((cur) => {
      const currentGlobal = cur?.global || {};
      const tlFilter = {
        ...cur,
        global: {
          ...currentGlobal,
          excludeConversation: !currentGlobal.excludeConversation,
        },
      };
      try {
        if (browser) {
          localStorage.setItem("timelineFilter", JSON.stringify(tlFilter));
        }
      } catch (error: any) {
        console.warn("Failed to save timelineFilter:", error);
      }
      return tlFilter;
    });
  };
</script>

<li class="mb-2">
  <label class="label">
    <input
      type="checkbox"
      class="rounded-checkbox"
      checked={timelineFilter.get()?.global?.excludeConversation ?? false}
      onchange={onChangeExcludeConversation}
    />
    {$_("filter.canversation.none")}
  </label>
</li>
{#if followList.get()?.size > 0}
  <li class="mb-2">
    <label class="label">
      <input
        type="checkbox"
        class="rounded-checkbox"
        checked={timelineFilter.get()?.global?.excludeFollowee ?? false}
        onchange={onChangeExcludeFollowee}
      />
      {$_("filter.menu.globalExcludeFollowee")}
    </label>
  </li>
{/if}
