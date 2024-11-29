<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import {
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { useGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";

  interface Props {
    pubkey: string;

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

    children?: import("svelte").Snippet<
      [{ relays: string[]; status: ReqStatus }]
    >;
    relayChange: (relays: string[]) => void;
  }
  let {
    pubkey,

    req = undefined,
    relayChange,
    error,
    loading,
    nodata,
    children,
  }: Props = $props();

  let result = $derived(deriveResult(pubkey, req));

  function deriveResult(
    pubkey: string,
    req:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined
  ) {
    return useGlobalRelaySet(
      ["globalRelay", pubkey],
      [
        { authors: [pubkey], kinds: [30002], "#d": ["global"], limit: 1 },
      ] as Nostr.Filter[],
      req
    );
  }

  let data = $derived(result?.data);
  let status = $derived(result?.status);
  let errorData = $derived(result?.error);

  $effect(() => {
    dataChange($data);
  });
  function dataChange(data: string[] | null | undefined) {
    if (data && data.length > 0) {
      console.log(data);
      relayChange(data);
    }
  }

  // $: if ($data && $data.length > 0) {
  //   console.log($data);
  //   dispatch("relayChange", { relays: $data });
  // }

  interface $$Slots {
    default: {
      relays: string[];
      status: ReqStatus;
    };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $data && $data.length > 0}
  {@render children?.({ relays: $data, status: $status ?? "error" })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
