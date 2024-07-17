<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { profile } from "$lib/func/util";
  import { _ } from "svelte-i18n";
  import Content from "./Content.svelte";
  import FollowButton from "./FollowButton.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import ProxyTag from "$lib/components/Elements/ProxyTag.svelte";
  export let displayMenu: boolean;
  export let note: Nostr.Event;
  export let proxy: string[] | undefined = undefined;
</script>

<div class={"grid grid-cols-[auto_1fr]"}>
  <div class="p-1">
    <UserMenu pubkey={note.pubkey} bind:metadata={note} size={40} />
  </div>
  <div class="p-1">
    <div class="flex align-middle">
      <div>
        {profile(note)?.display_name ?? profile(note)?.name}<span
          class="text-magnum-100 text-sm mt-auto mb-auto ml-1 inline-flex"
          >@{profile(note)?.name}</span
        >
      </div>
      <div class="ml-auto">
        <FollowButton pubkey={note.pubkey} />
      </div>
    </div>
    <hr />
    <div class=" max-h-48 overflow-y-auto">
      <Content
        text={profile(note)?.about ?? ""}
        tags={note.tags}
        {displayMenu}
      />
    </div>
    {#if proxy}
      <div class="text-end">
        <ProxyTag proxyTag={proxy} />
      </div>
    {/if}
  </div>
</div>
