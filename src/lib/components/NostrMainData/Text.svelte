<script lang="ts">
  import { useEvent } from "$lib/stores/useEvent";
  import type { ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";

  export let relays: string[] | undefined = undefined;
  export let queryKey: QueryKey;
  export let id: string;
  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined = undefined;
  $: max3relays = relays ? relays.slice(0, 3) : undefined;
  $: result = useEvent(queryKey, id, req, max3relays);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;

  interface $$Slots {
    default: { text: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data}
  <slot text={$data?.event} status={$status} />
{:else if $status === "success"}
  <slot name="nodata" />
{:else if $status === "loading"}
  <slot name="loading" />
{/if}
