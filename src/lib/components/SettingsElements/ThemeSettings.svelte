<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import ThemeSwitch from "../Elements/ThemeSwitch/ThemeSwitch.svelte";
  import ColorThemeSelect from "./ColorThemeSelect.svelte";
  import SettingsCard from "./SettingsCard.svelte";
</script>

<SettingsCard title={"Theme"}>
  <div class="flex gap-4 flex-col">
    <ThemeSwitch />
    <ColorThemeSelect />
  </div>
</SettingsCard>
