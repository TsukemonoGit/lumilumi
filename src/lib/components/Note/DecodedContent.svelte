<script lang="ts">
  import { nip19 } from "nostr-tools";
  import Note from "./Note.svelte";
  import UserName from "./UserName.svelte";
  import { Quote } from "lucide-svelte";
  import LatestEvent from "../NostrMainData/LatestEvent.svelte";
  import EventCard from "./EventCard.svelte";
  import Metadata from "../NostrMainData/Metadata.svelte";
  export let content: string | undefined;
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
  <span class="text-sm text-neutral-500 align-middle">
    <UserName pubhex={decoded.data} /></span
  >{:else if decoded.type === "nevent"}
  <span class="grid grid-cols-[auto_1fr_auto]">
    <Quote size="16" class="text-magnum-500 fill-magnum-600" />
    <Note id={decoded.data.id} mini={true} /><Quote
      size="16"
      class="text-magnum-500 fill-magnum-600"
    />
  </span>
{:else if decoded.type === "note"}
  <span class="grid grid-cols-[auto_1fr_auto]">
    <Quote size="16" class="text-magnum-500 fill-magnum-600" />
    <Note id={decoded.data} mini={true} /><Quote
      size="16"
      class="text-magnum-500 fill-magnum-600"
    />
  </span>
{:else if decoded.type === "naddr"}
  <span class="grid grid-cols-[auto_1fr_auto]">
    <Quote size="16" class="text-magnum-500 fill-magnum-600" />
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
      <div slot="nodata" class="text-sm text-neutral-500 flex-inline break-all">
        {content}
      </div>
      <div slot="error" class="text-sm text-neutral-500 flex-inline break-all">
        {content}
      </div>
      <EventCard note={event} status="loading" />
      <Metadata
        queryKey={["metadata", event.pubkey]}
        pubkey={event.pubkey}
        let:metadata
      >
        <div slot="loading">
          <EventCard note={event} status="loading" />
        </div>
        <div slot="nodata">
          <EventCard note={event} status="nodata" />
        </div>
        <div slot="error">
          <EventCard note={event} status="error" />
        </div>
        <EventCard {metadata} note={event} /></Metadata
      >
    </LatestEvent><Quote size="16" class="text-magnum-500 fill-magnum-600" />
  </span>
  <!---->
{:else if decoded.type === "nprofile"}<!---->
  <span class="text-sm text-neutral-500 flex-inline">
    <UserName pubhex={decoded.data.pubkey} />
  </span>
{:else if decoded.type === "nrelay"}<!---->
  <span class="text-sm text-neutral-500 flex-inline">
    {decoded.data}
  </span>
{:else if decoded.type === "nsec"}<!---->
{/if}
