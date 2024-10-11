<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { followList, showRelayIcon } from "$lib/stores/stores";

  import { nip19 } from "nostr-tools";

  import { datetime, formatAbsoluteDate, profile } from "$lib/func/util";

  import UserMenu from "$lib/components/Elements/UserPopupMenu.svelte";
  import { getRelaysById } from "$lib/func/nostr";
  import { goto } from "$app/navigation";
  import SeenonIcons from "./SeenonIcons.svelte";

  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined = undefined;
  //export let status: string | undefined = undefined;
  export let mini: boolean = false;
  //export let tag: string[] | undefined;
  export let depth: number;
  //const bech32Pattern = /<bech32>/;

  export let displayMenu: boolean = true;
  export let tieKey: string | undefined;
  $: petname = $followList.get(note.pubkey);
  // $: replaceable =
  //   (note.kind >= 30000 && note.kind < 40000) ||
  //   (note.kind >= 10000 && note.kind < 20000);

  const replaceable =
    (note.kind >= 30000 && note.kind < 40000) ||
    (note.kind >= 10000 && note.kind < 20000) ||
    note.kind === 0 ||
    note.kind === 3;
  const eventpointer: nip19.EventPointer = {
    id: note.id,
    relays: tieKey ? getRelaysById(note.id, tieKey) : [],
    author: note.pubkey,
    kind: note.kind,
  };
  const naddrpointer: nip19.AddressPointer = {
    kind: note.kind,
    identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
    pubkey: note.pubkey,
    relays: tieKey ? getRelaysById(note.id, tieKey) : [],
  };
  const naddr = nip19.naddrEncode(naddrpointer);
  const nevent = nip19.neventEncode(eventpointer);
  const handleClickToNotepage = () => {
    //Goto Note page

    goto(`/${replaceable ? naddr : nevent}`);
  };
</script>

<div class={"grid grid-cols-[auto_1fr] max-w-full overflow-x-hidden my-1"}>
  <div class="grid grid-rows-[auto_1fr] p-1">
    <div>
      <UserMenu
        pubkey={note.pubkey}
        bind:metadata
        size={mini ? 20 : 40}
        {displayMenu}
        {depth}
        {tieKey}
      />
    </div>
    {#if $showRelayIcon && displayMenu}
      <SeenonIcons id={note.id} width={mini ? 20 : 40} {tieKey} />{/if}
  </div>

  <div class="pt-1 max-w-full overflow-x-hidden">
    <div class="flex align-middle max-w-full overflow-x-hidden">
      {#if metadata}
        <div>
          {#if petname}<span class="font-bold text-magnum-100">📛{petname}</span
            >{:else}{profile(metadata)?.display_name ??
              profile(metadata)?.name}<span
              class="text-magnum-100 text-sm mt-auto mb-auto ml-1 inline-flex"
              >@{profile(metadata)?.name && profile(metadata)?.name !== ""
                ? profile(metadata)?.name
                : profile(metadata)?.display_name}</span
            >{/if}
        </div>
      {:else}
        <span class="text-magnum-100 text-sm mt-auto mb-auto break-all">
          @{nip19.npubEncode(note.pubkey)}</span
        >
      {/if}
      {#if displayMenu}
        <button
          on:click={handleClickToNotepage}
          class="inline-flex ml-auto mr-1 min-w-7 text-magnum-100 text-xs hover:underline"
        >
          <time datetime={datetime(note.created_at)}
            >{formatAbsoluteDate(note.created_at)}</time
          >
        </button>
      {/if}
    </div>
    <!--<hr />-->
    <slot></slot>
  </div>
</div>
