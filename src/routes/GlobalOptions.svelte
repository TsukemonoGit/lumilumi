<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { followList, timelineFilter } from "$lib/stores/globalRunes.svelte";

  const onChangeExcludeFollowee = () => {
    timelineFilter.update((cur) => {
      const tlFilter = {
        ...cur,
        global: {
          ...cur.global,
          excludeFollowee: !cur.global.excludeFollowee,
        },
      };
      localStorage.setItem("timelineFilter", JSON.stringify(tlFilter));
      return tlFilter;
    });
  };

  const onChangeExcludeConversation = () => {
    timelineFilter.update((cur) => {
      const tlFilter = {
        ...cur,
        global: {
          ...cur.global,
          excludeConversation: !cur.global.excludeConversation,
        },
      };
      localStorage.setItem("timelineFilter", JSON.stringify(tlFilter));
      return tlFilter;
    });
  };
</script>

<li class="mb-2">
  <label class="label">
    <input
      type="checkbox"
      class="rounded-checkbox"
      checked={timelineFilter.get().global?.excludeFollowee || false}
      onchange={onChangeExcludeFollowee}
    />
    {$_("filter.canversation.none")}
  </label>
</li>
{#if followList.get() !== undefined && followList.get().size > 0}
  <li class="mb-2">
    <label class="label">
      <input
        type="checkbox"
        class="rounded-checkbox"
        checked={timelineFilter.get().global?.excludeConversation || false}
        onchange={onChangeExcludeConversation}
      />
      {$_("filter.menu.globalExcludeFollowee")}
    </label>
  </li>
{/if}
