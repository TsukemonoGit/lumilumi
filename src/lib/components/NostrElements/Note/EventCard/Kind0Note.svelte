<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { profile } from "$lib/func/util";
  import { _ } from "svelte-i18n";

  import UserMenu from "$lib/components/Elements/UserPopupMenu.svelte";
  import FollowButton from "../FollowButton.svelte";
  import Content from "../Content.svelte";
  import DisplayName from "$lib/components/Elements/DisplayName.svelte";
  import { followList } from "$lib/stores/stores";

  export let displayMenu: boolean;
  export let note: Nostr.Event;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;

  $: prof = profile(note);
  $: petname = $followList.get(note.pubkey);
</script>

<div class="grid grid-cols-[auto_1fr] py-1">
  <div class="p-1">
    <UserMenu
      pubkey={note.pubkey}
      bind:metadata={note}
      size={40}
      {depth}
      {tieKey}
    />
  </div>
  <div class="p-1">
    <div
      class="flex align-middle whitespace-pre-wrap break-words"
      style="word-break: break-word;"
    >
      <div class="mb-2">
        {#if prof}
          <DisplayName
            height={21}
            name={prof.display_name ?? ""}
            tags={note.tags}
          />
          {#if prof.name && prof.name !== ""}<span
              class="text-magnum-100 text-sm mt-auto mb-auto ml-1 inline-flex whitespace-pre-wrap break-words"
              style="word-break: break-word;"
              ><DisplayName
                height={21}
                name={`@${prof.name}`}
                tags={note.tags}
              />
            </span>{/if}{/if}{#if petname}<span
            class="font-bold text-magnum-100">📛{petname}</span
          >{/if}
      </div>
      <div class="ml-auto">
        <FollowButton pubkey={note.pubkey} />
      </div>
    </div>
    <div
      class="max-h-48 overflow-y-auto whitespace-pre-wrap break-words"
      style="word-break: break-word;"
    >
      <Content
        text={prof?.about?.trim() ?? ""}
        tags={note.tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      />
    </div>
  </div>
</div>
