<script lang="ts">
  import { nip19 } from "nostr-tools";
  import Note from "./Note.svelte";
  import { Quote } from "lucide-svelte";
  import EventCard from "./EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import PopupUserName from "$lib/components/Elements/PopupUserName.svelte";
  import UserName from "./UserName.svelte";
  export let displayMenu: boolean;
  export let content: string | undefined;
  export let depth: number;
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
</script>

{#if decoded.type === "npub"}
  <span class="text-magnum-100"
    >{#if !displayMenu}<UserName pubhex={decoded.data} />{:else}<PopupUserName
        pubkey={decoded.data}
        metadata={undefined}
      />{/if}</span
  >
{:else if decoded.type === "nevent"}
  <span class="grid grid-cols-[auto_1fr_auto]">
    <Quote size="16" class="text-magnum-500 fill-magnum-500" />
    <div class="border rounded-md border-magnum-600/30">
      <Note id={decoded.data.id} mini={true} {displayMenu} {depth} />
    </div>
    <Quote size="16" class="text-magnum-500 fill-magnum-500" />
  </span>
{:else if decoded.type === "note"}
  <span class="grid grid-cols-[auto_1fr_auto]">
    <Quote size="16" class="text-magnum-500 fill-magnum-500" />
    <div class="border rounded-md border-magnum-600/30">
      <Note id={decoded.data} mini={true} {displayMenu} {depth} />
    </div>
    <Quote size="16" class="text-magnum-500 fill-magnum-500" />
  </span>
{:else if decoded.type === "naddr"}
  <span class="grid grid-cols-[auto_1fr_auto]">
    <Quote size="16" class="text-magnum-500 fill-magnum-500" />
    <div class="border rounded-md border-magnum-600/30">
      <LatestEvent
        queryKey={[
          "naddr",
          decoded.data.kind,
          decoded.data.pubkey,
          decoded.data.identifier,
        ]}
        filters={[
          {
            kinds: [decoded.data.kind],
            authors: [decoded.data.pubkey],
            "#d": [decoded.data.identifier],
          },
        ]}
        let:event
      >
        <div
          slot="loading"
          class="text-sm text-neutral-500 flex-inline break-all"
        >
          {content}
        </div>
        <div
          slot="nodata"
          class="text-sm text-neutral-500 flex-inline break-all"
        >
          {content}
        </div>
        <div
          slot="error"
          class="text-sm text-neutral-500 flex-inline break-all"
        >
          {content}
        </div>
        <Metadata
          queryKey={["metadata", event.pubkey]}
          pubkey={event.pubkey}
          let:metadata
        >
          <div slot="loading">
            <EventCard note={event} {displayMenu} status="loading" />
          </div>
          <div slot="nodata">
            <EventCard note={event} {displayMenu} status="nodata" />
          </div>
          <div slot="error">
            <EventCard note={event} {displayMenu} status="error" />
          </div>
          <EventCard {metadata} {displayMenu} note={event} /></Metadata
        >
      </LatestEvent>
    </div>
    <Quote size="16" class="text-magnum-500 fill-magnum-500" />
  </span>
  <!---->
{:else if decoded.type === "nprofile"}<!---->
  <span class="text-magnum-100"
    >{#if !displayMenu}<UserName
        pubhex={decoded.data.pubkey}
      />{:else}<PopupUserName
        pubkey={decoded.data.pubkey}
        metadata={undefined}
      />{/if}</span
  >
{:else if decoded.type === "nrelay"}<!---->
  <span class="text-sm text-neutral-500 flex-inline">
    {decoded.data}
  </span>
{:else if decoded.type === "nsec"}<!---->
{/if}
