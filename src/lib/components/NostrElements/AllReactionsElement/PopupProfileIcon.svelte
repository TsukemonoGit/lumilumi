<script lang="ts">
  import { decode } from "light-bolt11-decoder";
  import Metadata from "../../NostrMainData/Metadata.svelte";

  import * as Nostr from "nostr-typedef";
  import Avatar from "svelte-boring-avatars";
  import { splitHexColorString } from "$lib/func/util";
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import type { Profile } from "$lib/types";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import { showImg } from "$lib/stores/stores";
  import UserProfile from "$lib/components/NostrMainData/UserProfile.svelte";
  const size = 20;
  export let pubkey: string;

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

<!-- {JSON.stringify(
  decode(event.tags.find((tag) => tag[0] === "bolt11")?.[1] ?? ""),
  null,
  2
)} {JSON.stringify(event.tags, null, 2)}-->
<Popover>
  <div class="inline-flex">
    <Metadata queryKey={["metadata", pubkey]} {pubkey} let:metadata>
      <div slot="loading">
        <Avatar
          {size}
          name={pubkey}
          variant="beam"
          colors={splitHexColorString(pubkey)}
        />
      </div>
      <div slot="nodata">
        <Avatar
          {size}
          name={pubkey}
          variant="beam"
          colors={splitHexColorString(pubkey)}
        />
      </div>
      <div slot="error">
        <Avatar
          {size}
          name={pubkey}
          variant="beam"
          colors={splitHexColorString(pubkey)}
        />
      </div>

      {#if $showImg}
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
    </Metadata>
  </div>
  <div slot="popoverContent">
    <UserProfile {pubkey} bannerHeight={80} iconSize={60} />
  </div>
</Popover>
