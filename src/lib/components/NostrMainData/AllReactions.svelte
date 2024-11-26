<script lang="ts">
  import { useAllReactions } from "$lib/stores/useAllReactions";
  import type { ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";

  export let queryKey: QueryKey;
  export let id: string | undefined = undefined;
  export let atag: string | undefined = undefined;
  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined = undefined;

  $: result = useAllReactions(queryKey, id, atag, req);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;

  interface $$Slots {
    default: {
      kind1: Nostr.Event[];
      kind6: Nostr.Event[];
      kind7: Nostr.Event[];
      kind9735: Nostr.Event[];
      status: ReqStatus;
    };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
  //  $: console.log($status);
</script>

{#if $error}
  <slot name="error" error={$error} />{:else if $status === "success" && !$data}
  <slot name="nodata" />
{:else if $data && $data?.length > 0}
  <slot
    kind1={$data
      ?.map(({ event }) => event)
      .filter((event) => event.kind === 1 || event.kind === 42)}
    kind7={$data?.map(({ event }) => event).filter((event) => event.kind === 7)}
    kind6={$data?.map(({ event }) => event).filter((event) => event.kind === 6)}
    kind9735={$data
      ?.map(({ event }) => event)
      .filter((event) => event.kind === 9735)}
    status={$status}
  />
{:else if $status === "loading"}
  <slot name="loading" />
{/if}
