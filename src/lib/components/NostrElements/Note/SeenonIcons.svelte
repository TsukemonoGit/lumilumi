<script lang="ts">
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { formatUrl, relayInfoFun } from "$lib/func/util";
  import {
    slicedEvent,
    showImg,
    relayIconErrorStore,
  } from "$lib/stores/stores";
  import { Triangle } from "lucide-svelte";
  import Avatar from "svelte-boring-avatars";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import RelayCard from "$lib/components/NostrElements/Note/EventCard/RelayCard.svelte";
  import { getRelaysById } from "$lib/func/nostr";
  import { onMount } from "svelte";

  interface Props {
    id: string;
    width: number;
    tieKey: string | undefined;
  }

  let { id, width, tieKey }: Props = $props();

  let size = 16;
  let viewAll = $state(false);
  let relays: string[] = $state([]);
  slicedEvent.subscribe(() => {
    relays = tieKey ? getRelaysById(id, tieKey) : [];
  });
  onMount(() => {
    //でてすぐはちょっとしかリレーないから１秒後にもっかい取得し直してみる
    setTimeout(() => {
      relays = tieKey ? getRelaysById(id, tieKey) : [];
    }, 1000);
  });

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
          {#await relayInfoFun(url)}
            <Avatar {size} name={url} variant="beam" />
          {:then relayInfo}
            {#if !relayInfo}
              <Avatar {size} name={url} variant="beam" />
            {:else if $showImg && relayInfo.icon}
              <UserAvatar
                url={relayInfo.icon}
                name={url ?? ""}
                pubkey={undefined}
                title={url}
                {size}
              />
            {:else if $showImg && !$relayIconErrorStore.includes(url)}
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
