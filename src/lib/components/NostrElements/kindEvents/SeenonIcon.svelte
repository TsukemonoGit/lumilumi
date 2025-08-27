<script lang="ts">
  import { getRelayInfo, formatUrl } from "$lib/func/util";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { relayIconErrorStore } from "$lib/stores/stores";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "../user/UserAvatar.svelte";
  import RelayCard from "./EventCard/RelayCard.svelte";

  const { url, size, zIndex } = $props();

  const handleStateError = (url: string) => {
    if (!$relayIconErrorStore.includes(url)) {
      $relayIconErrorStore.push(url);
    }
  };
</script>

<Popover ariaLabel="relay Info" {zIndex}>
  <div title={url}>
    {#await getRelayInfo(url)}
      <Avatar {size} name={url} variant="beam" />
    {:then relayInfo}
      {#if !relayInfo}
        <Avatar {size} name={url} variant="beam" />
      {:else if lumiSetting.get().showImg && relayInfo.icon}
        <UserAvatar
          url={relayInfo.icon}
          name={url ?? ""}
          pubkey={undefined}
          title={url}
          {size}
        />
      {:else if lumiSetting.get().showImg && !$relayIconErrorStore.includes(url)}
        <UserAvatar
          url={formatUrl(url) + "favicon.ico"}
          name={url ?? ""}
          pubkey={undefined}
          {size}
          handleStateError={() => handleStateError(url)}
          title={url}
        />
      {:else}
        <Avatar {size} name={url} variant="beam" />
      {/if}
    {/await}
  </div>
  {#snippet popoverContent()}
    <div class="max-w-[90%]">
      <RelayCard {url} write={false} read={false} zIndex={zIndex + 10} />
    </div>
  {/snippet}
</Popover>
