<!-- tukattenai -->
<script lang="ts">
  import Metadata from "../../NostrMainData/Metadata.svelte";

  import Avatar from "svelte-boring-avatars";
  import { splitHexColorString } from "$lib/func/util";

  import type { Profile } from "$lib/types";
  import Popover from "$lib/components/Elements/Popover.svelte";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserAvatar from "./UserAvatar.svelte";
  import UserProfile from "./UserProfile.svelte";
  const size = 20;
  interface Props {
    pubkey: string;
    tieKey: string | undefined;
  }

  let { pubkey, tieKey }: Props = $props();

  const picture = (content: string): string | undefined => {
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
</script>

<Popover ariaLabel="user profile">
  <div class="inline-flex">
    <Metadata queryKey={["metadata", pubkey]} {pubkey}>
      {#snippet loading()}
        <div>
          <Avatar
            {size}
            name={pubkey}
            variant="beam"
            colors={splitHexColorString(pubkey)}
          />
        </div>
      {/snippet}
      {#snippet nodata()}
        <div>
          <Avatar
            {size}
            name={pubkey}
            variant="beam"
            colors={splitHexColorString(pubkey)}
          />
        </div>
      {/snippet}
      {#snippet error()}
        <div>
          <Avatar
            {size}
            name={pubkey}
            variant="beam"
            colors={splitHexColorString(pubkey)}
          />
        </div>
      {/snippet}

      {#snippet content({ metadata })}
        {#if lumiSetting.get().showImg}
          {#await picture(metadata.content) then picture}
            {#if picture !== undefined}
              <UserAvatar {size} name={pubkey} url={picture} {pubkey} />
            {:else}
              <Avatar
                {size}
                name={pubkey}
                variant="beam"
                colors={splitHexColorString(pubkey)}
              />
            {/if}
          {/await}
        {:else}
          <Avatar
            {size}
            name={pubkey}
            variant="beam"
            colors={splitHexColorString(pubkey)}
          />
        {/if}
      {/snippet}
    </Metadata>
  </div>
  {#snippet popoverContent()}
    <div>
      <UserProfile
        {pubkey}
        bannerHeight={80}
        iconSize={60}
        depth={0}
        {tieKey}
      />
    </div>
  {/snippet}
</Popover>
