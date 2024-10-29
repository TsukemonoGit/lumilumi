<script lang="ts">
  import { page } from "$app/stores";
  import { parseNaddr } from "$lib/func/util";
  import { showClientTag } from "$lib/stores/stores";
  import { nip19 } from "nostr-tools";

  export let tags: string[][];
  export let isShowClientTag: boolean = true;
  export let depth: number;
  $: clientTag = tags.find((tag) => tag[0] === "client");

  const onClickClientTag = (atag: string[]) => {
    const naddrAddress = parseNaddr(["a", ...atag]);
    const encoded = nip19.naddrEncode(naddrAddress);
    window.open(`https://nostrapp.link/a/${encoded}`, "_blank", "noreferrer");
  };
</script>

{#if clientTag && isShowClientTag && $showClientTag && !($page.route.id === "/[note=note]" || ($page.route.id === "/[naddr=naddr]" && depth === 0))}
  {#if clientTag.length > 2}<button
      title={"open in nostrapp.link"}
      on:click={() => onClickClientTag(clientTag.slice(2))}
      class={`inline float-end text-sm font-semibold text-magnum-500/75 hover:underline hover:text-magnum-400/80 w-fit whitespace-pre-wrap break-words `}
      style="word-break: break-word;"
      >via {clientTag[1]}
    </button>{:else}<span
      class={`inline float-end text-sm font-semibold text-neutral-200/50 w-fit whitespace-pre-wrap break-words`}
      style="word-break: break-word;"
      >via {clientTag[1]}
    </span>{/if}{/if}
