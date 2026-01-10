<script lang="ts">
  import { RefreshCw, SmilePlus } from "lucide-svelte";

  import EmojiListUpdate from "./SettingsElements/EmojiListUpdate.svelte";
  import Popover from "./Elements/Popover.svelte";
  import { getMetadataList, type MetadataList } from "$lib/func/nostr";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import type { QueryKey } from "@tanstack/svelte-query";
  import type { EventPacket } from "rx-nostr";
  import { checkUserInput, userName } from "$lib/func/user";
  import { untrack } from "svelte";
  interface Props {
    onClickUser: (pubhex: string) => void;
  }
  let input = $state("");
  let { onClickUser }: Props = $props();
  let openPopover: boolean = $state(false);
  // Derived data
  let metadataList: MetadataList = $state({});

  $effect(() => {
    if (openPopover) {
      untrack(() => {
        try {
          const metadataStr = localStorage.getItem(STORAGE_KEYS.METADATA);
          if (!metadataStr) return {};

          const metadataQueryData: [QueryKey, EventPacket][] =
            JSON.parse(metadataStr);
          metadataList = getMetadataList(metadataQueryData);
        } catch (error) {}
      });
    }
  });
</script>

<Popover bind:open={openPopover} ariaLabel="custom emoji" zIndex={100}>
  <div
    class="text-magnum-400 hover:text-magnum-200 transition-colors cursor-pointer"
  >
    <SmilePlus size="20" />
  </div>
  {#snippet popoverContent()}
    <div>
      <input
        type="text"
        id="npub"
        class="h-8 w-full rounded-md text-magnum-100 border-2
         border-magnum-400"
        bind:value={input}
      />

      <div
        class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto w-[calc(min(100vw,400px))]"
        style="overflow-anchor: auto;"
      >
        {#each Object.entries(metadataList) as [pubkey, profile], index}
          {#if checkUserInput(input, profile)}
            <button
              aria-label={`Select profile ${profile.display_name || profile.name || pubkey}`}
              onclick={() => onClickUser(pubkey)}
              class="rounded-md border m-0.5 p-2 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
            >
              {userName(pubkey, profile)}
            </button>
          {/if}
        {/each}
      </div>
    </div>
  {/snippet}
</Popover>
