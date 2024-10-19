<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { profile } from "$lib/func/util";
  import { _ } from "svelte-i18n";
  import Content from "./Content.svelte";
  import FollowButton from "./FollowButton.svelte";
  import UserMenu from "$lib/components/Elements/UserPopupMenu.svelte";
  import ProxyTag from "$lib/components/Elements/ProxyTag.svelte";
  export let displayMenu: boolean;
  export let note: Nostr.Event;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;
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
        {profile(note)?.display_name ?? profile(note)?.name}<span
          class="text-magnum-100 text-sm mt-auto mb-auto ml-1 inline-flex whitespace-pre-wrap break-words"
          style="word-break: break-word;"
          >@{profile(note)?.name && profile(note)?.name !== ""
            ? profile(note)?.name
            : profile(note)?.display_name}</span
        >
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
        text={profile(note)?.about?.trim() ?? ""}
        tags={note.tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      />
    </div>
  </div>
</div>
