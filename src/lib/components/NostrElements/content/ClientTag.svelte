<script lang="ts">
  import { page } from "$app/state";
  import { parseNaddr } from "$lib/func/util";
  import * as nip19 from "nostr-tools/nip19";

  interface Props {
    tags: string[][];
    isShowClientTag?: boolean;
    depth: number;
  }

  let { tags, isShowClientTag = true, depth }: Props = $props();
  let clientTag = $derived(tags.find((tag) => tag[0] === "client"));

  const onClickClientTag = (atag: string[]) => {
    const naddrAddress = parseNaddr(["a", ...atag]);
    const encoded = nip19.naddrEncode(naddrAddress);
    window.open(`https://nostrapp.link/a/${encoded}`, "_blank", "noreferrer");
  };
</script>

{#if clientTag && isShowClientTag && !(page.route.id === "/[note=note]" || (page.route.id === "/[naddr=naddr]" && depth === 0))}
  {#if clientTag.length > 2}<button
      title={"open in nostrapp.link"}
      onclick={() => onClickClientTag(clientTag.slice(2))}
      class={`ml-1 inline float-end text-sm font-semibold text-magnum-500/75 hover:underline hover:text-magnum-400/80 w-fit whitespace-pre-wrap break-words `}
      style="word-break: break-word;"
      >via {clientTag[1]}
    </button>{:else}<span
      class={`ml-1 inline float-end text-sm font-semibold text-neutral-200/50 w-fit whitespace-pre-wrap break-words`}
      style="word-break: break-word;"
      >via {clientTag[1]}
    </span>{/if}
{/if}
