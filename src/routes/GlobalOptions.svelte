<script lang="ts">
  import { t as _ } from '@konemono/svelte5-i18n';
  import { followList, timelineFilter } from "$lib/stores/globalRunes.svelte";

  const onChangeExcludeFollowee = () => {
    timelineFilter.update((cur) => {
      console.log(cur);
      return { ...cur, globalExcludeFollowee: !cur.globalExcludeFollowee };
    });
    localStorage.setItem(
      "timelineFilter",
      JSON.stringify(timelineFilter.get())
    );
  };
</script>

{#if followList.get() !== undefined && followList.get().size > 0}
  <li class="mb-2">
    <label class="label">
      <input
        type="checkbox"
        class="rounded-checkbox"
        checked={timelineFilter.get().globalExcludeFollowee}
        onchange={onChangeExcludeFollowee}
      />
      {$_("filter.menu.globalExcludeFollowee")}
    </label>
  </li>
{/if}
