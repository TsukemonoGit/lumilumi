<script lang="ts">
  import { nip19 } from "nostr-tools";
  import Note from "./Note.svelte";
  import { Quote } from "lucide-svelte";

  import PopupUserName from "$lib/components/Elements/PopupUserName.svelte";
  import UserName from "./UserName.svelte";

  import viewport from "$lib/func/useViewportAction";
  import NaddrEvent from "./NaddrEvent.svelte";
  export let displayMenu: boolean;
  export let content: string | undefined;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;
  export let decoded:
    | {
        type: "naddr";
        data: nip19.AddressPointer;
      }
    | {
        type: "nevent";
        data: nip19.EventPointer;
      }
    | {
        type: "nprofile";
        data: nip19.ProfilePointer;
      }
    | {
        type: "nsec";
        data: Uint8Array;
      }
    | {
        type: "npub" | "note";
        data: string;
      };

  let hasLoaded = false;
  const handleEnterViewport = () => {
    hasLoaded = true;
  };
</script>

<div
  use:viewport
  on:enterViewport={handleEnterViewport}
  class="inline overflow-hidden"
>
  {#if hasLoaded}{#if decoded.type === "npub"}<span
        class="text-magnum-300 align-middle"
        >{#if !displayMenu}<UserName
            pubhex={decoded.data}
          />{:else}<PopupUserName pubkey={decoded.data} {tieKey} />{/if}</span
      >{:else if decoded.type === "nevent"}<span
        class="grid grid-cols-[auto_1fr_auto]"
        ><Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />
        <div class="border rounded-md border-magnum-600/30">
          <Note
            id={decoded.data.id}
            mini={true}
            {displayMenu}
            {depth}
            {repostable}
            {tieKey}
          />
        </div>
        <Quote size="14" class="text-magnum-500 fill-magnum-500/75 " /></span
      >{:else if decoded.type === "note"}<span
        class="grid grid-cols-[auto_1fr_auto]"
        ><Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />
        <div class="border rounded-md border-magnum-600/30">
          <Note
            id={decoded.data}
            mini={true}
            {displayMenu}
            {depth}
            {repostable}
            {tieKey}
          />
        </div>
        <Quote size="14" class="text-magnum-500 fill-magnum-500/75 " /></span
      >{:else if decoded.type === "naddr"}<span
        class="grid grid-cols-[auto_1fr_auto]"
        ><Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />
        <div class="border rounded-md border-magnum-600/30">
          <NaddrEvent
            data={decoded.data}
            {displayMenu}
            {depth}
            {tieKey}
            {repostable}
            {content}
          />
        </div>
        <Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />
      </span>{:else if decoded.type === "nprofile"}<span
        class="text-magnum-300 align-middle"
        >{#if !displayMenu}<UserName
            pubhex={decoded.data.pubkey}
          />{:else}<PopupUserName
            pubkey={decoded.data.pubkey}
            {tieKey}
          />{/if}</span
      >
    {:else if decoded.type === "nsec"}{content}{/if}{:else}{content}{/if}
</div>
