<script lang="ts">
  import { page } from "$app/stores";
  import { datetime, parseNaddr } from "$lib/func/util";
  import { showClientTag } from "$lib/stores/stores";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  export let note: Nostr.Event;

  $: clientTag = note.tags.find((tag) => tag[0] === "client");

  const onClickClientTag = (atag: string[]) => {
    const naddrAddress = parseNaddr(["a", ...atag]);
    const encoded = nip19.naddrEncode(naddrAddress);
    window.open(`https://nostrapp.link/a/${encoded}`, "_blank", "noreferrer");
  };
</script>

<div class=" p-1 text-neutral-300">
  <time datetime={datetime(note.created_at)}
    >{new Date(note.created_at * 1000).toLocaleString()}</time
  >

  {#if clientTag && $showClientTag}
    - {#if clientTag.length > 2}<button
        title={"open in nostrapp.link"}
        on:click={() => onClickClientTag(clientTag.slice(2))}
        class={` text-magnum-200 hover:underline w-fit whitespace-pre-wrap break-words`}
        style="word-break: break-word;"
      >
        {clientTag[1]}
      </button>{:else}<span
        class={` w-fit whitespace-pre-wrap break-words`}
        style="word-break: break-word;"
        >{clientTag[1]}
      </span>{/if}{/if}
</div>
