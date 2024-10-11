<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { showImg } from "$lib/stores/stores";
  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "./UserAvatar.svelte";

  import { splitHexColorString } from "$lib/func/util";
  import type { Profile } from "$lib/types";

  import Popover from "./Popover.svelte";
  import UserProfile from "./UserProfile.svelte";
  import { _ } from "svelte-i18n";
  import { writable } from "svelte/store";

  import UserMenu from "./UserMenu.svelte";

  export let pubkey: string;
  export let size: number;
  export let metadata: Nostr.Event | undefined;
  export let displayMenu: boolean = true;
  export let depth: number;
  export let tieKey: string | undefined;

  const getProfile = (ev: Nostr.Event | undefined): Profile | undefined => {
    if (!ev) return undefined;
    try {
      return JSON.parse(ev.content);
    } catch {
      return undefined;
    }
  };
  $: profile = getProfile(metadata);
  $: url = profile?.picture;
  const title = writable<string>("");
  $: if (profile && profile.name) {
    $title = `@${profile.name}`;
  }
</script>

{#if !displayMenu}
  <!-- <div title={$title}> -->
  {#if $showImg && url && url !== ""}
    <UserAvatar {url} name={pubkey} {pubkey} {size} title={$title} />
  {:else}
    <Avatar
      {size}
      name={pubkey}
      variant="beam"
      colors={splitHexColorString(pubkey)}
    />
  {/if}
  <!-- </div> -->
{:else}
  <Popover ariaLabel="user profile">
    {#if $showImg && url && url !== ""}
      <UserAvatar {url} name={pubkey} {pubkey} {size} title={$title} />
    {:else}
      <Avatar
        {size}
        name={pubkey}
        variant="beam"
        colors={splitHexColorString(pubkey)}
      />
    {/if}
    <div slot="popoverContent" class="p-1 w-[24rem] max-w-full">
      <UserProfile {pubkey} bannerHeight={80} iconSize={60} {depth} {tieKey} />

      <!--ユーザーポップアップのとこのUserMenu消してみる-->
      <div
        class="flex flex-col flex-wrap divide-y divide-zinc-500 bg-zinc-800 border border-zinc-100 rounded-md px-1"
      >
        <div class="text-zinc-300 font-bold pl-2 text-md py-2">User Menu</div>

        <UserMenu {pubkey} {metadata} {profile} {tieKey} />
      </div>
    </div></Popover
  >
{/if}
