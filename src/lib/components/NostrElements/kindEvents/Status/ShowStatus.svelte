<script lang="ts">
  import StatusGeneral from "../../../renderSnippets/nostr/StatusGeneral.svelte";

  import { beforeNavigate } from "$app/navigation";
  import StatusMusic from "$lib/components/renderSnippets/nostr/StatusMusic.svelte";

  import { page } from "$app/state";

  import { getStatusLink } from "$lib/func/status";
  import GeneralStatusDisplay from "./GeneralStatusDisplay.svelte";
  import MusicStatusDisplay from "./MusicStatusDisplay.svelte";

  interface Props {
    pubkey: string | undefined;

    color?: string | undefined;
  }

  let { pubkey = $bindable(), color }: Props = $props();
  beforeNavigate((navigate) => {
    //console.log("beforeNavigate", navigate.type);
    if (navigate.type !== "form") {
      pubkey = undefined;
    }
  });
</script>

{#if pubkey}
  <StatusGeneral {pubkey}>
    {#snippet children({ event })}
      {@const link = getStatusLink(event, page.url.origin)}
      <div class="flex gap-1 items-center">
        <GeneralStatusDisplay {link} {event} {color} />
      </div>
    {/snippet}
  </StatusGeneral>
  <StatusMusic {pubkey}>
    {#snippet children({ event })}
      {@const link =
        event.tags.find((tag: string[]) => tag[0] === "r")?.[1] ?? ""}
      <div class="flex gap-1 items-center">
        <MusicStatusDisplay {event} {link} {color} />
      </div>
    {/snippet}
  </StatusMusic>
{/if}
