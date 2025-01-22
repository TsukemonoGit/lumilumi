<script lang="ts">
  import { followList } from "$lib/stores/globalRunes.svelte";

  import { onlyFollowee } from "$lib/stores/stores";

  import { _ } from "svelte-i18n";

  const handleChangeChecked = () => {
    console.log($onlyFollowee);
    localStorage.setItem("onlyFollowee", $onlyFollowee.toString());
  };
</script>

{#if followList.get() && followList.get().size > 0}
  <label class="ml-auto my-2">
    <input
      type="checkbox"
      class="rounded-checkbox"
      bind:checked={$onlyFollowee}
      onchange={handleChangeChecked}
    />
    {$_("notifications.onlyFollowee")}
  </label>
{/if}
