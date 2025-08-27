<script lang="ts">
  import Avatar from "svelte-boring-avatars";
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
  import { splitHexColorString } from "$lib/func/util";

  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserAvatar from "$lib/components/NostrElements/user/UserAvatar.svelte";

  //let metadata: Nostr.Event;

  interface Props {
    //let url = writable<string>();
    size?: number;
    square?: boolean;
  }

  const { size = 24, square = false }: Props = $props();
  const picture = (metadata: Nostr.Event): string | null => {
    if (!metadata) {
      return null;
    }
    try {
      const profile: Profile = JSON.parse(metadata.content);
      return profile.picture || null;
    } catch (error) {
      return null;
    }
  };

  const avatarColor = $derived(splitHexColorString(lumiSetting.get().pubkey));
</script>

{#if lumiSetting.get().pubkey}
  <div class="my-auto">
    <Metadata
      queryKey={["metadata", lumiSetting.get().pubkey]}
      pubkey={lumiSetting.get().pubkey}
    >
      {#snippet loading()}
        <div>
          <Avatar
            {square}
            {size}
            name={lumiSetting.get().pubkey}
            variant="beam"
            colors={avatarColor}
          />
        </div>
      {/snippet}
      {#snippet nodata()}
        <div>
          <Avatar
            {square}
            {size}
            name={lumiSetting.get().pubkey}
            variant="beam"
            colors={avatarColor}
          />
        </div>
      {/snippet}
      {#snippet error()}
        <div>
          <Avatar
            {square}
            {size}
            name={lumiSetting.get().pubkey}
            variant="beam"
            colors={avatarColor}
          />
        </div>
      {/snippet}
      {#snippet content({ metadata })}
        {@const url = picture(metadata)}
        <div
          style={`width:${size}px;height:${size}px`}
          class="flex justify-center items-center"
        >
          {#if lumiSetting.get().showImg && metadata && url && url !== ""}
            <UserAvatar
              {square}
              {url}
              name={metadata.pubkey}
              pubkey={metadata.pubkey}
              {size}
            />
          {:else}
            <Avatar
              {square}
              {size}
              name={lumiSetting.get().pubkey}
              variant="beam"
              colors={avatarColor}
            />
          {/if}
        </div>
      {/snippet}
    </Metadata>
  </div>
{/if}
