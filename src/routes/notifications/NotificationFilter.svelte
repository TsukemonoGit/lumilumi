<script lang="ts">
  import { followList, notifiSettings } from "$lib/stores/globalRunes.svelte";

  import { t as _ } from "@konemono/svelte5-i18n";
</script>

{#if followList.get() && followList.get().size > 0}
  <label class="ml-auto my-2">
    <input
      type="checkbox"
      class="rounded-checkbox"
      bind:checked={notifiSettings.onlyFollowee}
    />
    {$_("notifications.onlyFollowee")}
  </label>
{/if}
