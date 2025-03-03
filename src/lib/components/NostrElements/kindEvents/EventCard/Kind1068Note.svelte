<script lang="ts">
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";

  import * as Nostr from "nostr-typedef";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import NoteTemplate from "./NoteTemplate.svelte";
  import { formatAbsoluteDate } from "$lib/func/util";

  import Link from "$lib/components/Elements/Link.svelte";
  import { nip19 } from "nostr-tools";
  import { getRelaysById } from "$lib/func/nostr";
  import { SquareArrowOutUpRight } from "lucide-svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;

    tieKey: string | undefined;
    mini: boolean;
    warning: string[] | undefined;

    repostable: boolean;
  }

  let {
    note,
    metadata,
    displayMenu,
    depth,

    tieKey,
    mini,
    warning,

    repostable,
  }: Props = $props();

  let deleted = $state(false);
  let polltype: string | undefined = $derived(
    note.tags.find((tag) => tag[0] === "polltype" && tag.length > 1)?.[1]
  );
  let endsAt: number | undefined = $derived(
    Number(note.tags.find((tag) => tag[0] === "endsAt" && tag.length > 1)?.[1])
  );

  let nevent: string | undefined = $derived.by(() => {
    if (!note) {
      return undefined;
    }
    try {
      const eventpointer: nip19.EventPointer = {
        id: note.id,
        relays: tieKey ? getRelaysById(note.id, tieKey) : [],
        author: note.pubkey,
        kind: note.kind,
      };
      return nip19.neventEncode(eventpointer);
    } catch {
      return undefined;
    }
  });
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
  <NoteTemplate
    {note}
    {metadata}
    {mini}
    {displayMenu}
    {depth}
    {tieKey}
    kindInfo={note.kind !== 1 ? true : false}
  >
    {#if lumiSetting.get().showUserStatus}<ShowStatus
        pubkey={note.pubkey}
        {tieKey}
      />{/if}

    <div class="relative overflow-hidden mb-1.5">
      <div class="flex flex-col p-0.5 mt-1">
        {#each note.tags.filter((tag) => tag[0] === "option" && tag.length > 2) as itemTag}
          <label>
            <input type="radio" disabled={true} /><span class="ml-2 break-all"
              >{itemTag[2]}</span
            ></label
          >
        {/each}
      </div>
      <div class="mt-2">
        {#if Math.floor(Date.now() / 1000) > endsAt}
          <p class="text-neutral-500 font-sm">Voting period has ended</p>
        {:else}
          <p class="text-neutral-500 font-sm">
            Ends at: {formatAbsoluteDate(endsAt)}
          </p>
        {/if}

        <p class="text-neutral-500 font-sm">Type: {polltype}</p>
      </div>
      <Link
        className="underline text-magnum-300 break-all hover:opacity-80 flex items-center gap-1"
        href={`https://nos-haiku.vercel.app/entry/${nevent}`}
        >go to poll<SquareArrowOutUpRight size={12} /></Link
      >
      {#if warning}
        <WarningHide2 text={warning[1]} />
      {/if}
    </div>

    {#if displayMenu}
      <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
  </NoteTemplate>
{/if}
