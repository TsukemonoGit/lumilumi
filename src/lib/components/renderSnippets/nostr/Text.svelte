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
  import { untrack } from "svelte";

  interface Props {
    relays?: string[] | undefined;
    queryKey: QueryKey;
    id: string;
    req?:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    content?: import("svelte").Snippet<
      [{ data: Nostr.Event; status: ReqStatus }]
    >;
    onChange?: (metadata: Nostr.Event) => void;
  }

  let {
    req = undefined,
    relays = undefined,
    queryKey,
    id,
    error,
    loading,
    nodata,
    content,
    onChange,
  }: Props = $props();

  let max3relays = $derived(relays ? relays.slice(0, 3) : undefined);
  let result = $derived(useEvent(queryKey, id, req, max3relays));
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
  <!-- <slot name="error" error={$error} /> -->
{:else if $status === "success" && !$data?.event && !$data?.event.id}
  {@render nodata?.()}
  <!-- <slot name="nodata" /> -->
{:else if $data && $data?.event}
  {@render content?.({ data: $data?.event, status: $status })}
  <!-- <slot event={$data.event} status={$status} /> -->
{:else}
  {@render loading?.()}
  <!-- <slot name="loading" /> -->
{/if}
