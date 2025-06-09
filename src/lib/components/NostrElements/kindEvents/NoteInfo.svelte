<script lang="ts">
  import { datetime, parseNaddr } from "$lib/func/util";

  import * as nip19 from "nostr-tools/nip19";
  import * as Nostr from "nostr-typedef";
  interface Props {
    note: Nostr.Event;
  }

  let { note }: Props = $props();

  let clientTag = $derived(note.tags.find((tag) => tag[0] === "client"));

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

  {#if clientTag}
    - {#if clientTag.length > 2}<button
        title={"open in nostrapp.link"}
        onclick={() => onClickClientTag(clientTag.slice(2))}
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
