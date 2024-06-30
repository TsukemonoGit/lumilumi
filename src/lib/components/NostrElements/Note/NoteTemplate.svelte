<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { viewEventIds } from "$lib/stores/stores";

  import { nip19 } from "nostr-tools";

  import { formatAbsoluteDate, profile } from "$lib/func/util";

  import { onDestroy } from "svelte";

  import UserMenu from "$lib/components/Elements/UserMenu.svelte";

  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined = undefined;
  export let status: string | undefined = undefined;
  export let mini: boolean = false;
  export let tag: string[] | undefined;
  const bech32Pattern = /<bech32>/;
  let currentNoteId: string | undefined = undefined;

  // $: replaceable =
  //   (note.kind >= 30000 && note.kind < 40000) ||
  //   (note.kind >= 10000 && note.kind < 20000);

  $: if (note && note.id !== currentNoteId) {
    $viewEventIds = $viewEventIds.filter((item) => item !== currentNoteId);
    if (!$viewEventIds.includes(note.id)) {
      $viewEventIds.push(note.id);
    }
    currentNoteId = note.id;
  }

  onDestroy(() => {
    $viewEventIds = $viewEventIds.filter((item: string) => item !== note.id);
  });
</script>

<div class={"grid grid-cols-[auto_1fr] max-w-full overflow-x-hidden"}>
  <div class="p-1">
    <UserMenu pubkey={note.pubkey} bind:metadata size={mini ? 20 : 40} />
  </div>
  <div class="p-1 max-w-full overflow-x-hidden">
    <div class="flex align-middle max-w-full overflow-x-hidden">
      {#if metadata}
        <div>
          {profile(metadata)?.display_name ?? profile(metadata)?.name}<span
            class="text-magnum-100 text-sm mt-auto mb-auto ml-1 inline-flex"
            >@{profile(metadata)?.name}</span
          >
        </div>
      {:else}
        <span class="text-magnum-100 text-sm mt-auto mb-auto break-all">
          @{nip19.npubEncode(note.pubkey)}</span
        >
      {/if}
      <div
        class="inline-flex ml-auto mr-1 min-w-7 text-magnum-100 text-xs mt-auto mb-auto"
      >
        {formatAbsoluteDate(note.created_at)}
      </div>
    </div>
    <hr />
    <slot></slot>
  </div>
</div>
