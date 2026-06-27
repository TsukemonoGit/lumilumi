<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";

  import SettingsCard from "./SettingsCard.svelte";
  import type { LumiSetting } from "$lib/types";

  interface Props {
    settings: LumiSetting;
  }
  let { settings = $bindable() }: Props = $props();
</script>

<SettingsCard title={$_("settings.display.title")}>
  <div class="flex flex-col gap-4">
    <label>
      <input
        type="checkbox"
        class="rounded-checkbox"
        bind:checked={settings.showPreview}
      />
      {$_("settings.display.preview")}
    </label>
    <label>
      <input
        type="checkbox"
        class="rounded-checkbox"
        bind:checked={settings.menuleft}
      />
      {$_("settings.display.menu")}
    </label>
    <label>
      <input
        type="checkbox"
        class="rounded-checkbox"
        bind:checked={settings.showRelayIcon}
      />
      {$_("settings.display.showRelayIcon")}
    </label>
  </div>
</SettingsCard>
