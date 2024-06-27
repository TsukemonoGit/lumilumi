<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import UserMenu from "../Elements/UserMenu.svelte";
  import { profile } from "$lib/func/util";
  import { _ } from "svelte-i18n";
  import Content from "./Content.svelte";
  import FollowButton from "./FollowButton.svelte";

  export let note: Nostr.Event;
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

      <FollowButton pubkey={note.pubkey} />
    </div>
    <hr />
    <div class=" max-h-48 overflow-y-auto">
      <Content text={profile(note)?.about ?? ""} tags={note.tags} />
    </div>
  </div>
</div>
