<!--名前文字列クリックしたらユーザーメニューのポップアップが出るやつ-->
<script lang="ts">
  import Popover from "../../Elements/Popover.svelte";
  import UserProfile from "./UserProfile.svelte";
  import UserName from "./UserName.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import UserMenu from "./UserMenu.svelte";
  import { getProfile } from "$lib/func/event";

  import Metadata from "../../renderSnippets/nostr/Metadata.svelte";

  interface Props {
    pubkey: string;

    zIndex?: number;
  }

  let { pubkey, zIndex }: Props = $props();
</script>

<Popover ariaLabel="user profile"
  >{#snippet children()}<UserName pubhex={pubkey} />
  {/snippet}
  {#snippet popoverContent()}
    <div class="w-[24rem] max-w-full">
      <UserProfile
        {pubkey}
        bannerHeight={60}
        iconSize={56}
        depth={0}
        zIndex={zIndex || 0 + 10}
      />
      <!--ユーザーポップアップのとこのUserMenu消してみる-->
      <div
        class="flex flex-col flex-wrap divide-y divide-zinc-500 bg-zinc-800 border border-zinc-100 rounded-md px-1"
      >
        <div class="text-zinc-300 font-bold pl-2 text-md py-2">User Menu</div>
        <Metadata queryKey={["metadata", pubkey]} {pubkey}>
          {#snippet loading()}
            <div>
              <UserMenu {pubkey} metadata={undefined} profile={undefined} />
            </div>
          {/snippet}
          {#snippet nodata()}
            <div>
              <UserMenu {pubkey} metadata={undefined} profile={undefined} />
            </div>
          {/snippet}
          {#snippet error()}
            <div>
              <UserMenu {pubkey} metadata={undefined} profile={undefined} />
            </div>
          {/snippet}
          {#snippet content({ metadata })}
            {@const profile = getProfile(metadata)}
            <UserMenu {pubkey} {metadata} {profile} />
          {/snippet}
        </Metadata>
      </div>
    </div>
  {/snippet}</Popover
>
