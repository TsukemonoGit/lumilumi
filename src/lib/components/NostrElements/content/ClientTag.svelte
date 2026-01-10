<script lang="ts">
  import { page } from "$app/state";
  import Link from "$lib/components/Elements/Link.svelte";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import { parseNaddr } from "$lib/func/util";
  import * as nip19 from "nostr-tools/nip19";
  import NaddrEvent from "../kindEvents/NaddrEvent.svelte";

  interface Props {
    tags: string[][];
    isShowClientTag?: boolean;
    depth: number;
  }

  let { tags, isShowClientTag = true, depth }: Props = $props();
  let clientTag = $derived(tags.find((tag) => tag[0] === "client"));

  let naddrAddress: undefined | nip19.AddressPointer = $derived.by(() => {
    if (!clientTag || clientTag.length < 3) return;
    return parseNaddr(["a", ...clientTag.slice(2)]);
  });
  let naddrUrl: undefined | string = $derived(
    naddrAddress ? nip19.naddrEncode(naddrAddress) : undefined
  );
  let appLink: undefined | string = $derived(
    naddrUrl ? `https://nostrapp.link/a/${naddrUrl}` : undefined
  );
  let isNotePage = $derived(
    page.route.id === "/[note=note]" || page.route.id === "/[naddr=naddr]"
  );
</script>

{#if clientTag && isShowClientTag && !(isNotePage && depth === 0)}
  {#if clientTag.length > 2}<div
      class={"ml-1 inline float-end text-sm font-semibold text-magnum-500/75 hover:underline hover:text-magnum-400/80 w-fit whitespace-pre-wrap break-words "}
      style="word-break: break-word;"
    >
      <Popover ariaLabel="client info">
        via {clientTag[1]}

        {#snippet popoverContent()}<div class=" w-80">
            <NaddrEvent
              data={parseNaddr(["", clientTag[2]])}
              content={clientTag[1]}
              depth={0}
              displayMenu={false}
              repostable={false}
            />

            <Link
              href={appLink!}
              className="text-magnum-400 hover:underline text-sm float-end"
            >
              Open in nostrapp.link
            </Link>
          </div>
        {/snippet}
      </Popover>
    </div>
  {:else}<span
      class={`ml-1 inline float-end text-sm font-semibold text-neutral-200/50 w-fit whitespace-pre-wrap break-words`}
      style="word-break: break-word;"
      >via {clientTag[1]}
    </span>{/if}
{/if}
