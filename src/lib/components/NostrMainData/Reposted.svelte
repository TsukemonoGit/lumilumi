<script lang="ts">
  import type { ReqStatus, RxReqBase } from "$lib/types";

  import type Nostr from "nostr-typedef";

  import { queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";
  import type { EventPacket } from "rx-nostr";

  export let id: string;
  export let req: RxReqBase | undefined = undefined;
  let _result: { data: EventPacket; status: any; error: any };

  const observer2 = new QueryObserver($queryClient, {
    queryKey: ["reactions", "repost", id],
  });
  const unsubscribe1 = observer2.subscribe((result: any) => {
    if (
      !_result?.data ||
      (result?.data &&
        result.data.event &&
        result.data.event.created_at > _result.data.event.created_at)
    ) {
      _result = result;
    }
  });
  $: data = _result?.data;
  $: status = _result?.status;
  $: error = _result?.error;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { event: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if error}
  <slot name="error" {error} />
{:else if data}
  <slot event={data?.event} {status} />
{:else if status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
