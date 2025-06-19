<script lang="ts">
  import { nip19 } from "nostr-tools";
  import Note from "./Note.svelte";
  import { Quote } from "lucide-svelte";

  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";
  import UserName from "../user/UserName.svelte";

  import NaddrEvent from "./NaddrEvent.svelte";

  interface Props {
    displayMenu: boolean;
    content: string | undefined;
    depth: number;
    repostable: boolean;

    maxHeight: number | undefined;
    decoded: nip19.DecodedResult;
    zIndex: number | undefined;
  }

  let {
    displayMenu,
    content,
    depth,
    repostable,

    decoded,
    maxHeight,
    zIndex,
  }: Props = $props();
</script>

<div class="inline overflow-hidden">
  {#if decoded.type === "npub"}<span class="text-magnum-300 align-middle"
      >{#if !displayMenu}<UserName pubhex={decoded.data} />{:else}<PopupUserName
          pubkey={decoded.data}
          {zIndex}
        />{/if}</span
    >{:else if decoded.type === "nprofile"}<span
      class="text-magnum-300 align-middle"
      >{#if !displayMenu}<UserName
          pubhex={decoded.data.pubkey}
        />{:else}<PopupUserName
          {zIndex}
          pubkey={decoded.data.pubkey}
        />{/if}</span
    >{:else if decoded.type === "nevent"}<span
      class="grid grid-cols-[auto_1fr_auto]"
      ><Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />

      <Note
        className="border rounded-md border-magnum-600/30"
        id={decoded.data.id}
        mini={true}
        {displayMenu}
        {depth}
        {repostable}
        {maxHeight}
        {zIndex}
      />

      <Quote size="14" class="text-magnum-500 fill-magnum-500/75 " /></span
    >{:else if decoded.type === "note"}<span
      class="grid grid-cols-[auto_1fr_auto]"
      ><Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />
      <Note
        className="border rounded-md border-magnum-600/30"
        id={decoded.data}
        mini={true}
        {displayMenu}
        {depth}
        {repostable}
        {maxHeight}
        {zIndex}
      />

      <Quote size="14" class="text-magnum-500 fill-magnum-500/75 " /></span
    >{:else if decoded.type === "naddr"}<span
      class="grid grid-cols-[auto_1fr_auto]"
      ><Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />

      <NaddrEvent
        className="border rounded-md border-magnum-600/30"
        data={decoded.data}
        {displayMenu}
        {depth}
        {repostable}
        {content}
        {zIndex}
        mini={true}
      />

      <Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />
    </span>
  {:else if decoded.type === "nsec"}{content}
  {/if}
</div>
