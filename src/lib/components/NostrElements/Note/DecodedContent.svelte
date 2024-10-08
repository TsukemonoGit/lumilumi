<script lang="ts">
  import { nip19 } from "nostr-tools";
  import Note from "./Note.svelte";
  import { Quote } from "lucide-svelte";
  import EventCard from "./EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import PopupUserName from "$lib/components/Elements/PopupUserName.svelte";
  import UserName from "./UserName.svelte";

  import EllipsisMenuNaddr from "./NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import viewport from "$lib/func/useViewportAction";
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
        type: "nrelay" | "npub" | "note";
        data: string;
      };

  let hasLoaded = false;
  const handleEnterViewport = () => {
    hasLoaded = true;
  };
</script>

<div use:viewport on:enterViewport={handleEnterViewport} class="inline">
  {#if hasLoaded}{#if decoded.type === "npub"}<span
        class="text-magnum-100 align-middle"
        >{#if !displayMenu}<UserName
            pubhex={decoded.data}
          />{:else}<PopupUserName
            pubkey={decoded.data}
            metadata={undefined}
            {tieKey}
          />{/if}</span
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
          <LatestEvent
            queryKey={[
              "naddr",
              `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`,
            ]}
            filters={[
              decoded.data.identifier !== ""
                ? {
                    kinds: [decoded.data.kind],
                    authors: [decoded.data.pubkey],
                    "#d": [decoded.data.identifier],
                  }
                : {
                    kinds: [decoded.data.kind],
                    authors: [decoded.data.pubkey],
                  },
            ]}
            let:event
          >
            <div
              slot="loading"
              class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
            >
              {content}{#if displayMenu}<EllipsisMenuNaddr
                  naddr={content?.slice(6)}
                />{/if}
            </div>
            <div
              slot="nodata"
              class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
            >
              {content}{#if displayMenu}<EllipsisMenuNaddr
                  naddr={content?.slice(6)}
                />{/if}
            </div>
            <div
              slot="error"
              class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
            >
              {content}{#if displayMenu}<EllipsisMenuNaddr
                  naddr={content?.slice(6)}
                />{/if}
            </div>
            <Metadata
              queryKey={["metadata", event.pubkey]}
              pubkey={event.pubkey}
              let:metadata
            >
              <div slot="loading">
                <EventCard note={event} {displayMenu} {repostable} {tieKey} />
              </div>
              <div slot="nodata">
                <EventCard note={event} {displayMenu} {repostable} {tieKey} />
              </div>
              <div slot="error">
                <EventCard note={event} {displayMenu} {repostable} {tieKey} />
              </div>
              <EventCard
                {metadata}
                {displayMenu}
                note={event}
                {repostable}
                {tieKey}
              /></Metadata
            >
          </LatestEvent>
        </div>
        <Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />
      </span>{:else if decoded.type === "nprofile"}<span
        class="text-magnum-100 align-middle"
        >{#if !displayMenu}<UserName
            pubhex={decoded.data.pubkey}
          />{:else}<PopupUserName
            pubkey={decoded.data.pubkey}
            metadata={undefined}
            {tieKey}
          />{/if}</span
      >
    {:else if decoded.type === "nrelay"}<span
        class="text-sm text-neutral-500 flex-inline">{decoded.data}</span
      >{:else if decoded.type === "nsec"}{content}{/if}{:else}{content}{/if}
</div>
