<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { getRelaysById } from "$lib/func/nostr";
  import * as nip19 from "nostr-tools/nip19";
  import type { Profile } from "$lib/types";
  import { isAddressableKind, isReplaceableKind } from "nostr-tools/kinds";

  import SeenonIcon from "./NostrElements/kindEvents/SeenonIcon.svelte";

  interface Props {
    dialogOpen: any;
    note: Nostr.Event;

    profile?: Profile | undefined;
    zIndex?: number;
  }
  let {
    dialogOpen = $bindable(),
    note,

    profile = undefined,
    zIndex = 0,
  }: Props = $props();

  let replaceable = $derived(
    note && (isReplaceableKind(note.kind) || isAddressableKind(note.kind))
  );

  let { naddr, nevent, encodedPubkey } = $derived.by(() => {
    let nevent: string | undefined = undefined;
    let naddr: string | undefined = undefined;
    let encodedPubkey: string | undefined = undefined;
    if (note) {
      try {
        if (replaceable) {
          const naddrpointer: nip19.AddressPointer = {
            kind: note.kind,
            identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
            pubkey: note.pubkey,
            relays: getRelaysById(note.id),
          };
          naddr = nip19.naddrEncode(naddrpointer);
          nevent = undefined;
        } else {
          const eventpointer: nip19.EventPointer = {
            id: note.id,
            relays: getRelaysById(note.id),
            author: note.pubkey,
            kind: note.kind,
          };

          nevent = nip19.neventEncode(eventpointer);
          naddr = undefined;
        }
      } catch (error) {
        nevent = undefined;
        naddr = undefined;
      }
      try {
        encodedPubkey = nip19.npubEncode(note.pubkey);
      } catch {
        encodedPubkey = undefined;
      }
    }
    return { naddr, nevent, encodedPubkey };
  });
</script>

<h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
<div
  class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh] max-w-[90vw]"
>
  {JSON.stringify(note, null, 2)}
</div>
<div class="my-1 break-all overflow-auto">
  <!-- <div class="text-lg font-medium">Encoded</div> -->
  <div class=" font-mono font-bold text-xs">{encodedPubkey}</div>
  <div class=" font-mono font-bold text-xs">
    {replaceable ? naddr : nevent}
  </div>
</div>

{#if profile}
  <h2 class="mt-1 text-lg font-medium">User Data</h2>
  <div
    class=" overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[25vh]"
  >
    {#each Object.entries(profile) as [data, index]}
      <div class="flex flex-col py-1">
        <div class="font-bold whitespace-pre-wrap break-wards">
          {data}
        </div>
        <div class="ml-2 whitespace-pre-wrap break-all">
          {#if typeof profile[data] === "object"}
            {JSON.stringify(profile[data], null, 2)}
          {:else}
            {profile[data]}{/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
<h2 class="m-0 text-lg font-medium">Seen on</h2>
<div class="break-words whitespace-pre-wrap gap-2 flex flex-wrap">
  {#each getRelaysById(note.id) as relay}
    <!-- <div> --><SeenonIcon url={relay} size={24} zIndex={110} />
    <!-- {relay}</div> -->
  {/each}
</div>
