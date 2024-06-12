<script lang="ts">
  import { nip19 } from "nostr-tools";
  import Note from "./Note.svelte";
  import UserName from "./UserName.svelte";
  import { Quote } from "lucide-svelte";
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
  <span class="text-sm text-neutral-500 flex">
    <UserName pubhex={decoded.data} />
  </span>
{:else if decoded.type === "nevent"}
  <span class="grid grid-cols-[auto_1fr_auto]">
    <Quote size="16" class="text-magnum-500 fill-magnum-600" />
    <Note id={decoded.data.id} /><Quote
      size="16"
      class="text-magnum-500 fill-magnum-600"
    />
  </span>
{:else if decoded.type === "note"}
  <span class="grid grid-cols-[auto_1fr_auto]">
    <Quote size="16" class="text-magnum-500 fill-magnum-600" />
    <Note id={decoded.data} /><Quote
      size="16"
      class="text-magnum-500 fill-magnum-600"
    />
  </span>
{:else if decoded.type === "naddr"}
  <!---->
{:else if decoded.type === "nprofile"}<!---->
{:else if decoded.type === "nrelay"}<!---->
{:else if decoded.type === "nsec"}<!---->
{/if}
