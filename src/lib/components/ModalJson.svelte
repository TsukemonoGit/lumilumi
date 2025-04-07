<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Dialog from "./Elements/Dialog.svelte";
  import { getRelaysById } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";
  import type { Profile } from "$lib/types";
  import { isAddressableKind, isReplaceableKind } from "nostr-tools/kinds";

  interface Props {
    dialogOpen: any;
    note: Nostr.Event;
    tieKey: string | undefined;
    profile?: Profile | undefined;
    zIndex?: number;
  }
  let {
    dialogOpen = $bindable(),
    note,
    tieKey,
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
            relays: tieKey ? getRelaysById(note.id, tieKey) : [],
          };
          naddr = nip19.naddrEncode(naddrpointer);
          nevent = undefined;
        } else {
          const eventpointer: nip19.EventPointer = {
            id: note.id,
            relays: tieKey ? getRelaysById(note.id, tieKey) : [],
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

{#if note}
  <!--JSON no Dialog-->
  <Dialog
    id={`json_${note.id}`}
    bind:open={dialogOpen}
    dialogTitle="EVENT JSON"
    zIndex={zIndex + 10}
  >
    {#snippet main()}
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
      <div class="break-words whitespace-pre-wrap">
        {tieKey ? getRelaysById(note.id, tieKey).join(", ") : ""}
      </div>
    {/snippet}</Dialog
  >
{/if}
