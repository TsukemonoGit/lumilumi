<!--Text.svelte-->
<script lang="ts">
  import { useEvent } from "$lib/stores/useEvent";
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import { untrack, type Snippet } from "svelte";

  interface Props {
    relays?: string[] | undefined;
    id: string;
    error?: Snippet<[Error]>;
    nodata?: Snippet;
    loading?: Snippet;

    content?: Snippet<[{ data: Nostr.Event; status: ReqStatus }]>;
    onChange?: (event: Nostr.Event) => void;
  }

  let {
    relays = undefined,

    id,
    error,
    loading,
    nodata,
    content,
    onChange,
  }: Props = $props();

  let queryKey = $derived(["note", id]);
  let max3relays = $derived(relays ? relays.slice(0, 3) : undefined);
  let result = $derived(useEvent(queryKey, id, max3relays));
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);

  $effect(() => {
    if ($data?.event) {
      untrack(() => onChange?.($data?.event));
    }
  });
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $data && $data?.event}
  {@render content?.({
    data: $data?.event,
    status: $status,
  })}{:else if $status === "success" && !$data?.event?.id}
  {@render nodata?.()}
{:else}
  {@render loading?.()}
{/if}
