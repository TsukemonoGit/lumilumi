<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { onMount } from "svelte";

  import SettingsCard from "./SettingsCard.svelte";
  import { addToast } from "../Elements/Toast.svelte";
  import { clearNwcUri, loadNwcUri, saveNwcUri } from "$lib/func/nwc";

  let input = $state("");
  let connected = $state(false);

  onMount(() => {
    connected = loadNwcUri() !== null;
  });

  function handleClickSave() {
    try {
      saveNwcUri(input);
      input = "";
      connected = true;
      addToast({
        data: {
          title: "Success",
          description: $_("settings.nwc.saved"),
          color: "bg-green-500",
        },
      });
    } catch (error) {
      addToast({
        data: {
          title: "Error",
          description: $_("settings.nwc.invalid"),
          color: "bg-red-500",
        },
      });
    }
  }

  function handleClickClear() {
    clearNwcUri();
    connected = false;
  }
</script>

<SettingsCard
  title={$_("settings.nwc.title")}
  desc={$_("settings.nwc.desc")}
>
  {#if connected}
    <div class="flex items-center gap-4">
      <span class="text-magnum-200">{$_("settings.nwc.connected")}</span>
      <button
        type="button"
        class="h-10 rounded-full bg-neutral-800 px-3 py-1 font-medium text-neutral-200 myButton"
        onclick={handleClickClear}>{$_("settings.nwc.disconnect")}</button
      >
    </div>
  {:else}
    <div class="flex gap-2">
      <input
        type="password"
        autocomplete="off"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500"
        placeholder="nostr+walletconnect://..."
        bind:value={input}
      />
      <button
        type="button"
        class="h-10 rounded-full bg-neutral-800 px-3 py-1 font-medium text-neutral-200 myButton"
        onclick={handleClickSave}>{$_("settings.nwc.connect")}</button
      >
    </div>
  {/if}
  <div class="text-sm mt-2 text-neutral-400">{$_("settings.nwc.notes")}</div>
</SettingsCard>
