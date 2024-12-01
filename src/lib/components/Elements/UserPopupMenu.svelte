<script lang="ts">
  import { run } from "svelte/legacy";

  import * as Nostr from "nostr-typedef";
  import { showImg } from "$lib/stores/stores";
  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "./UserAvatar.svelte";

  import { splitHexColorString } from "$lib/func/util";
  import { hexRegex } from "$lib/func/regex";

  import Popover from "./Popover.svelte";
  import UserProfile from "./UserProfile.svelte";
  import { _ } from "svelte-i18n";

  import UserMenu from "./UserMenu.svelte";
  import { getProfile } from "$lib/func/event";

  interface Props {
    pubkey: string;
    size: number;
    metadata: Nostr.Event | undefined;
    displayMenu?: boolean;
    depth: number;
    tieKey: string | undefined;
  }

  let {
    pubkey,
    size,
    metadata,
    displayMenu = true,
    depth,
    tieKey,
  }: Props = $props();

  let profile = $derived(getProfile(metadata));
  let url = $derived(profile?.picture);
  let title = $derived.by(() => {
    if (profile && profile.name) {
      return `@${profile.name}`;
    } else {
      return "";
    }
  });

  let pubcheck = $derived(hexRegex.test(pubkey));
</script>

{#if !displayMenu || !pubcheck}
  <!-- <div title={$title}> -->
  {#if $showImg && url && url !== ""}
    <UserAvatar {url} name={pubkey} {pubkey} {size} {title} />
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
      <UserAvatar {url} name={pubkey} {pubkey} {size} {title} />
    {:else}
      <Avatar
        {size}
        name={pubkey}
        variant="beam"
        colors={splitHexColorString(pubkey)}
      />
    {/if}
    {#snippet popoverContent()}
      <div class="p-1 w-[24rem] max-w-full">
        <UserProfile
          {pubkey}
          bannerHeight={80}
          iconSize={60}
          {depth}
          {tieKey}
        />

        <!--ユーザーポップアップのとこのUserMenu消してみる-->
        <div
          class="flex flex-col flex-wrap divide-y divide-zinc-500 bg-zinc-800 border border-zinc-100 rounded-md px-1"
        >
          <div class="text-zinc-300 font-bold pl-2 text-md py-2">User Menu</div>

          <UserMenu {pubkey} {metadata} {profile} {tieKey} />
        </div>
      </div>
    {/snippet}</Popover
  >
{/if}
