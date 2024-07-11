<script lang="ts">
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { getRelaysById } from "$lib/func/nostr";
  import { relayInfoFun } from "$lib/func/util";
  import { showImg } from "$lib/stores/stores";
  import { Triangle } from "lucide-svelte";
  import { afterUpdate } from "svelte";
  import Avatar from "svelte-boring-avatars";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import RelayCard from "$lib/components/NostrElements/Note/RelayCard.svelte";

  export let id: string;
  export let width: number;
  let imageLoaded = true;

  let relays = getRelaysById(id);
  afterUpdate(() => {
    relays = getRelaysById(id);
  });
  let size = 16;
  let viewAll = false;
</script>

<div class="flex flex-wrap gap-1 align-baseline h-fit" style="width:{width}px ">
  {#each viewAll ? relays : relays.slice(0, 2) as url}
    <Popover>
      <button>
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
              {size}
            />
          {:else if $showImg && imageLoaded}
            {@const httpsUrl = url.startsWith("wss://")
              ? url.replace(/^wss:/, "https:")
              : url.replace(/^ws:/, "http:")}
            <UserAvatar
              url={httpsUrl + "favicon.ico"}
              name={url ?? ""}
              pubkey={undefined}
              {size}
            />
          {:else}
            <Avatar {size} name={url} variant="beam" />
          {/if}
        {/await}</button
      >
      <div slot="popoverContent" class="max-w-[90%]">
        <RelayCard {url} write={false} read={false} />
      </div>
    </Popover>
  {/each}
  {#if !viewAll && relays.length > 2}
    <button
      style="width:{width}px "
      on:click={() => (viewAll = true)}
      class="hover:opacity-75 active:opacity-50 border border-zinc-600 rounded-sm flex justify-center"
    >
      <Triangle
        size={size - 2}
        class="rotate-180 text-zinc-600 fill-zinc-600"
      /></button
    >
  {:else if viewAll && relays.length > 2}
    <button
      style="width:{width}px "
      on:click={() => (viewAll = false)}
      class="hover:opacity-75 active:opacity-50 border mx-0.5 border-zinc-600 rounded-sm flex justify-center"
    >
      <Triangle size={size - 2} class=" text-zinc-600 fill-zinc-600" /></button
    >
  {/if}
</div>
