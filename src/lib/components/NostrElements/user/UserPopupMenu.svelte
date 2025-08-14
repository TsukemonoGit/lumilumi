<!--ユーザーアイコンクリックしたらユーザーメニューのポップアップが出るやつ-->
<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "./UserAvatar.svelte";

  import { splitHexColorString } from "$lib/func/util";
  import { hexRegex } from "$lib/func/regex";

  import UserProfile from "./UserProfile.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import UserMenu from "./UserMenu.svelte";
  import { getProfile } from "$lib/func/event";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import Popover from "$lib/components/Elements/Popover.svelte";

  interface Props {
    pubkey: string;
    size: number;
    metadata?: Nostr.Event | undefined;
    displayMenu?: boolean;
    depth: number;
    zIndex?: number;
  }

  let {
    pubkey,
    size,
    metadata,
    displayMenu = true,
    depth,
    zIndex = 30,
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

  let avatarColor = $derived(splitHexColorString(pubkey));
</script>

{#if !displayMenu || !pubcheck}
  <!-- <div title={$title}> -->
  {#if lumiSetting.get().showImg && url && url !== ""}
    <UserAvatar {url} name={pubkey} {pubkey} {size} {title} />
  {:else}
    <Avatar {size} name={pubkey} variant="beam" colors={avatarColor} />
  {/if}
  <!-- </div> -->
{:else}
  <Popover ariaLabel="user profile" {zIndex}>
    {#if lumiSetting.get().showImg && url && url !== ""}
      <UserAvatar {url} name={pubkey} {pubkey} {size} {title} />
    {:else}
      <Avatar {size} name={pubkey} variant="beam" colors={avatarColor} />
    {/if}
    {#snippet popoverContent()}
      <div class="p-1 w-[24rem] max-w-full">
        <UserProfile
          zIndex={zIndex + 10}
          {pubkey}
          bannerHeight={60}
          iconSize={56}
          {depth}
        />

        <!--ユーザーポップアップのとこのUserMenu消してみる-->
        <div
          class="flex flex-col flex-wrap divide-y divide-zinc-500 bg-zinc-800 border border-zinc-100 rounded-md px-1"
        >
          <div class="text-zinc-300 font-bold pl-2 text-md py-2">User Menu</div>

          <UserMenu {pubkey} {metadata} {profile} />
        </div>
      </div>
    {/snippet}</Popover
  >
{/if}
