<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import UserMenu from "../Elements/UserMenu.svelte";
  import { formatAbsoluteDate, profile } from "$lib/func/util";
  import { _ } from "svelte-i18n";
  import Content from "./Content.svelte";
  import { isfolloweeFunc } from "$lib/func/dataUpdate";

  export let note: Nostr.Event;

  $: isfollowee = isfolloweeFunc(note.pubkey);

  const handleClickFollow = async () => {
    console.log("mada");
  };
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

      {#if isfollowee !== undefined}
        <div class="flex ml-auto items-end">
          <button
            class=" rounded-full bg-white border border-magnum-700 p-3 break-keep
      font-medium leading-none text-magnum-700 shadow hover:opacity-75 {isfollowee
              ? 'opacity-75'
              : ''}"
            on:click={handleClickFollow}
            >{isfollowee
              ? `${$_("user.following")}`
              : `${$_("user.follow")}`}</button
          >
        </div>
      {/if}
    </div>
    <hr />
    <div class=" max-h-48 overflow-y-auto">
      <Content text={profile(note)?.about ?? ""} tags={note.tags} />
    </div>
  </div>
</div>
