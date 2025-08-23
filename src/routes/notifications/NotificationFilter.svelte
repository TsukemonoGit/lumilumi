<script lang="ts">
  import { followList, notifiSettings } from "$lib/stores/globalRunes.svelte";

  import { t as _ } from "@konemono/svelte5-i18n";
  import { saveNotifiSettings } from "./notifiSettingsRepository";

  let onlyFollowee = $derived(notifiSettings.get().onlyFollowee);

  const handleChangeChecked = () => {
    notifiSettings.update((current) => {
      const updated = {
        ...current,
        onlyFollowee: !notifiSettings.get().onlyFollowee,
      };
      saveNotifiSettings(updated);
      return updated;
    });
  };
</script>

{#if followList.get() && followList.get().size > 0}
  <label class="ml-auto my-2">
    <input
      type="checkbox"
      class="rounded-checkbox"
      bind:checked={onlyFollowee}
      onchange={handleChangeChecked}
    />
    {$_("notifications.onlyFollowee")}
  </label>
{/if}
