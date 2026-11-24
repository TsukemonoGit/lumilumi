<script lang="ts">
  import StatusGeneral from "../../../renderSnippets/nostr/StatusGeneral.svelte";

  import { beforeNavigate } from "$app/navigation";
  import StatusMusic from "#lib/components/renderSnippets/nostr/StatusMusic.svelte";

  import { page } from "$app/state";

  import { getStatusLink } from "#lib/func/status.ts";
  import GeneralStatusDisplay from "./GeneralStatusDisplay.svelte";
  import MusicStatusDisplay from "./MusicStatusDisplay.svelte";

  interface Props { pubkey: string | undefined; color?: string | undefined }

  let { pubkey = $bindable(), color }: Props = $props();
  beforeNavigate((navigate) => {
    // 画像モーダル等のshallow goto、または同一URLへのpopstate
    // （履歴stateの更新のみ）ではステータスを消さない
    const sameUrl = navigate.from?.url.href === navigate.to?.url.href;
    if (
      (navigate.type === "goto" && navigate.shallow) ||
      (navigate.type === "popstate" && sameUrl)
    )
      return;

    //console.log("beforeNavigate", navigate.type);
    if (navigate.type !== "form") {
      pubkey = undefined;
    }
  });
</script>

{#if pubkey}
  <StatusGeneral pubkey={pubkey}>
    {#snippet children({ event })}
      {@const link = getStatusLink(event, page.url.origin)}
      <div class="flex gap-1 items-center"><GeneralStatusDisplay link={link} event={event} color={color} /></div>
    {/snippet}
  </StatusGeneral>
  <StatusMusic pubkey={pubkey}>
    {#snippet children({ event })}
      {@const link = event.tags.find((tag: string[]) => tag[0] === "r")?.[1] ?? ""}
      <div class="flex gap-1 items-center"><MusicStatusDisplay event={event} link={link} color={color} /></div>
    {/snippet}
  </StatusMusic>
{/if}
