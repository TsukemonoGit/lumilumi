<script lang="ts">
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { followList } from "$lib/stores/globalRunes.svelte";

  import { onlyFollowee } from "$lib/stores/stores";

  import { t as _ } from "@konemono/svelte5-i18n";

  const handleChangeChecked = () => {
    console.log($onlyFollowee);
    try {
      localStorage.setItem(
        STORAGE_KEYS.OLD_ONLY_FOLLOWEE,
        $onlyFollowee.toString()
      );
    } catch (error) {
      console.log("Failed to save");
    }
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
