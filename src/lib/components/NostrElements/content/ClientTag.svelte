<script lang="ts">
  import { page } from "$app/state";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import { parseNaddr } from "$lib/func/util";
  import * as nip19 from "nostr-tools/nip19";

  interface Props {
    tags: string[][];
    isShowClientTag?: boolean;
    depth: number;
    zIndex?: number | undefined;
  }

  let { tags, isShowClientTag = true, depth, zIndex }: Props = $props();
  let clientTag = $derived(tags.find((tag) => tag[0] === "client"));

  let isPopoverOpen = $state(false);

  const onClickClientTag = (atag: string[]) => {
    const naddrAddress = parseNaddr(["a", ...atag]);
    const encoded = nip19.naddrEncode(naddrAddress);
    window.open(`https://nostrapp.link/a/${encoded}`, "_blank", "noreferrer");
  };
</script>

{#if clientTag && isShowClientTag && !(page.route.id === "/[note=note]" || (page.route.id === "/[naddr=naddr]" && depth === 0))}
  {#if clientTag.length > 2}
    <Popover
      bind:open={isPopoverOpen}
      ariaLabel="client tag"
      {zIndex}
      showCloseButton={true}
      buttonClass={"ml-1 inline float-end text-sm font-semibold text-magnum-500/75 hover:underline hover:text-magnum-400/80 w-fit whitespace-pre-wrap break-words"}
      style="word-break: break-word;"
      >via {clientTag[1]}
      {#snippet popoverContent()}
        <!-- TODO: kind31990コンポーネントを表示 -->
        <div class="p-2">
          <p class="text-sm">Client: {clientTag[1]}</p>
          <button
            title="open in nostrapp.link"
            onclick={() => onClickClientTag(clientTag.slice(2))}
            class="text-magnum-400 hover:underline text-sm"
          >
            Open in nostrapp.link
          </button>
        </div>
      {/snippet}
    </Popover>
  {:else}<span
      class={`ml-1 inline float-end text-sm font-semibold text-neutral-200/50 w-fit whitespace-pre-wrap break-words`}
      style="word-break: break-word;"
      >via {clientTag[1]}
    </span>{/if}
{/if}
