<script lang="ts">
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import type { Ogp } from "$lib/func/ogp";
  import { profile } from "$lib/func/util";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import { eventKinds } from "$lib/func/kinds";

  export let note: Nostr.Event;
  export let data: {
    ogp: Ogp;
    url: string;
  };
  export let metadata: Nostr.Event | undefined;
  export let displayMenu: boolean;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;
</script>

<div class=" break-all overflow-x-hidden gap-4 p-1">
  <div class="flex gap-1 w-fit">
    {#if metadata}
      <div>
        <UserMenu
          pubkey={note.pubkey}
          bind:metadata
          size={20}
          {displayMenu}
          {depth}
          {tieKey}
        />
      </div>
      <div class="text-magnum-100 text-sm">
        @{profile(metadata)?.name && profile(metadata)?.name !== ""
          ? profile(metadata)?.name
          : profile(metadata)?.display_name}
      </div>
      <div class="text-neutral-300/50 text-sm">
        {eventKinds.get(note.kind)?.en ?? `kind:${note.kind}`}
      </div>
    {/if}
  </div>

  <OgpCard
    contents={data.ogp}
    url={data.url}
  />{#if displayMenu}<NoteActionButtons {note} {repostable} {tieKey} />{/if}
</div>
