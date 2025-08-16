<script lang="ts">
  import { useAllReactions } from "$lib/stores/useAllReactions";
  import type { ReqResult, ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import type {
    EventPacket,
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";
  import { untrack } from "svelte";
  import { readable } from "svelte/store";

  interface Props {
    id?: string | undefined;
    atag?: string | undefined;
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
      [
        {
          kind1: Nostr.Event[];
          kind6: Nostr.Event[];
          kind7: Nostr.Event[];
          kind9735: Nostr.Event[];
          status: ReqStatus;
        },
      ]
    >;
  }

  let {
    req = undefined,
    id = undefined,
    atag = undefined,

    error,
    loading,
    nodata,
    children,
  }: Props = $props();

  let result = $derived(useAllReactions(id, atag, req));

  // debounce用の状態
  let debounceTimeoutId: NodeJS.Timeout | undefined = undefined;
  let debouncedResult: ReqResult<EventPacket[]> = $state({
    data: readable([] as EventPacket[]),
    status: readable("loading"),
    error: readable(),
  });
  const debounceInterval = 300;

  // resultの変更をdebounceして反映
  $effect(() => {
    // タイマーをクリアして最新の結果で再設定
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
    }

    debounceTimeoutId = setTimeout(() => {
      untrack(() => {
        debouncedResult = { ...result }; // オブジェクトのコピーを作成
      });
      debounceTimeoutId = undefined;
    }, debounceInterval);
  });

  let data = $derived(debouncedResult.data);
  let status = $derived(debouncedResult.status);
  let errorData = $derived(debouncedResult.error);
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $status === "success" && !$data}
  {@render nodata?.()}
{:else if $data && $data?.length > 0}
  {@render children?.({
    kind1: $data
      ?.map(({ event }) => event)
      .filter(
        (event) => event.kind === 1 || event.kind === 42 || event.kind === 1111
      ),
    kind7: $data?.map(({ event }) => event).filter((event) => event.kind === 7),
    kind6: $data?.map(({ event }) => event).filter((event) => event.kind === 6),
    kind9735: $data
      ?.map(({ event }) => event)
      .filter((event) => event.kind === 9735),
    status: $status,
  })}
{:else if $status === "loading"}
  {@render loading?.()}
{/if}
