<!-- tukattenai -->
<script lang="ts">
  import Avatar from "svelte-boring-avatars";
  import { splitHexColorString } from "$lib/func/util";

  import type { Profile } from "$lib/types";
  import Popover from "$lib/components/Elements/Popover.svelte";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserAvatar from "./UserAvatar.svelte";
  import UserProfile from "./UserProfile.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  const size = 20;
  interface Props {
    pubkey: string;
    tieKey: string | undefined;
  }

  let { pubkey, tieKey }: Props = $props();

  const getPicture = (content: string): string | undefined => {
    try {
      const profile: Profile = JSON.parse(content);
      if (profile?.picture !== "") {
        return profile.picture;
      } else {
        throw Error;
      }
    } catch (error) {
      return undefined;
    }
  };
  let avatarColor = $derived(splitHexColorString(pubkey));
</script>

<Popover ariaLabel="user profile">
  <div class="inline-flex">
    <Metadata queryKey={["metadata", pubkey]} {pubkey}>
      {#snippet loading()}
        <div>
          <Avatar {size} name={pubkey} variant="beam" colors={avatarColor} />
        </div>
      {/snippet}
      {#snippet nodata()}
        <div>
          <Avatar {size} name={pubkey} variant="beam" colors={avatarColor} />
        </div>
      {/snippet}
      {#snippet error()}
        <div>
          <Avatar {size} name={pubkey} variant="beam" colors={avatarColor} />
        </div>
      {/snippet}

      {#snippet content({ metadata })}
        {#if lumiSetting.get().showImg}
          {@const picture = getPicture(metadata.content)}
          {#if picture !== undefined}
            <UserAvatar {size} name={pubkey} url={picture} {pubkey} />
          {:else}
            <Avatar {size} name={pubkey} variant="beam" colors={avatarColor} />
          {/if}
        {:else}
          <Avatar {size} name={pubkey} variant="beam" colors={avatarColor} />
        {/if}
      {/snippet}
    </Metadata>
  </div>
  {#snippet popoverContent()}
    <div>
      <UserProfile
        {pubkey}
        bannerHeight={60}
        iconSize={56}
        depth={0}
        {tieKey}
      />
    </div>
  {/snippet}
</Popover>
