<script lang="ts">
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import UserMenu from "$lib/components/Elements/UserPopupMenu.svelte";
  import type { Ogp } from "$lib/func/ogp";
  import { profile } from "$lib/func/util";
  import * as Nostr from "nostr-typedef";

  import { eventKinds } from "$lib/func/kinds";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import DisplayName from "$lib/components/Elements/DisplayName.svelte";

  interface Props {
    note: Nostr.Event;
    data: {
      ogp: Ogp;
      url: string;
    };
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    tieKey: string | undefined;
  }

  let { note, data, metadata, displayMenu, depth, repostable, tieKey }: Props =
    $props();

  let prof = $derived(profile(metadata));
</script>

<div class=" break-all overflow-x-hidden gap-4 p-1">
  <div class="flex gap-1 w-fit">
    {#if metadata}
      <div>
        <UserMenu
          pubkey={note.pubkey}
          {metadata}
          size={20}
          {displayMenu}
          {depth}
          {tieKey}
        />
      </div>
      <div class="text-magnum-100 text-sm">
        {#if prof}
          <DisplayName
            height={21}
            name={`@${prof?.name ?? prof?.display_name ?? ""}`}
            tags={metadata.tags}
          />{:else}noname{/if}
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
