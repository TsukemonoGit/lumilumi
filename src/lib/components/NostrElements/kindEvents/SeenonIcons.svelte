<script lang="ts">
  import { formatUrl, getRelayInfo } from "$lib/func/util";
  import { relayIconErrorStore } from "$lib/stores/stores";
  import { Triangle } from "lucide-svelte";
  import Avatar from "svelte-boring-avatars";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import RelayCard from "$lib/components/NostrElements/kindEvents/EventCard/RelayCard.svelte";
  import { getRelaysById } from "$lib/func/nostr";

  import { displayEvents, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserAvatar from "../user/UserAvatar.svelte";

  interface Props {
    id: string;
    width: number;
    tieKey: string | undefined;
  }

  let { id, width, tieKey }: Props = $props();

  let size = 16;
  let viewAll = $state(false);
  let relays: string[] = $derived.by(() => {
    if (displayEvents.get && tieKey) {
      return getRelaysById(id, tieKey);
    } else return [];
  });

  // let relays: string[] = $derived.by(async () => {
  //   await setRelay(id, tieKey);
  // });

  // async function setRelay(
  //   id: string,
  //   tiekey: string | undefined
  // ): Promise<string[]> {
  //   if (displayEvents.get && tiekey) {
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     return getRelaysById(id, tiekey) as string[];
  //   } else return [];
  // }

  const handleStateError = (url: string) => {
    if (!$relayIconErrorStore.includes(url)) {
      $relayIconErrorStore.push(url);
    }
  };
</script>

{#if relays.length > 0}
  <div
    class="flex flex-wrap gap-1 align-baseline h-fit"
    style="width:{width}px "
  >
    {#each viewAll ? relays : relays.slice(0, 2) as url}
      <Popover ariaLabel="relay Info">
        <div title={url}>
          {#await getRelayInfo(url)}
            <Avatar {size} name={url} variant="beam" />
          {:then relayInfo}
            {#if !relayInfo}
              <Avatar {size} name={url} variant="beam" />
            {:else if lumiSetting.get().showImg && relayInfo.icon}
              <UserAvatar
                url={relayInfo.icon}
                name={url ?? ""}
                pubkey={undefined}
                title={url}
                {size}
              />
            {:else if lumiSetting.get().showImg && !$relayIconErrorStore.includes(url)}
              <UserAvatar
                url={formatUrl(url) + "favicon.ico"}
                name={url ?? ""}
                pubkey={undefined}
                {size}
                handleStateError={() => handleStateError(url)}
                title={url}
              />
            {:else}
              <Avatar {size} name={url} variant="beam" />
            {/if}
          {/await}
        </div>
        {#snippet popoverContent()}
          <div class="max-w-[90%]">
            <RelayCard {url} write={false} read={false} />
          </div>
        {/snippet}
      </Popover>
    {/each}
    {#if !viewAll && relays.length > 2}
      <button
        title="more"
        style="width:{width}px "
        onclick={() => {
          viewAll = true;
        }}
        class="hover:opacity-75 active:opacity-50 border border-zinc-600 rounded-sm flex justify-center"
      >
        <Triangle
          size={size - 2}
          class="rotate-180 text-zinc-600 fill-zinc-600"
        /></button
      >
    {:else if viewAll && relays.length > 2}
      <button
        title="less"
        style="width:{width}px "
        onclick={() => {
          viewAll = false;
        }}
        class="hover:opacity-75 active:opacity-50 border mx-0.5 border-zinc-600 rounded-sm flex justify-center"
      >
        <Triangle
          size={size - 2}
          class=" text-zinc-600 fill-zinc-600"
        /></button
      >
    {/if}
  </div>
{/if}
