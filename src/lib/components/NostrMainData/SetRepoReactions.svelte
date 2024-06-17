<script lang="ts">
  import { useRepReactionList } from "$lib/stores/useRepReactionList";
  import { viewEventIds, loginUser } from "$lib/stores/stores";
  import type { ReqStatus, RxReqBase } from "$lib/types";
  import type Nostr from "nostr-typedef";
  import type { RxNostr } from "rx-nostr";
  import { changeEmit } from "$lib/func/reactions";

  export let rxNostr: RxNostr | undefined = undefined;
  export let req: RxReqBase | undefined = undefined;
  //export let events: Nostr.Event<number>[];

  let filters: Nostr.Filter[] = [];
  let result: { data: any; status: any; error: any };

  let lastUpdateTimestamp = Date.now() + 1000; // 初回は余裕を持たせる
  const updateInterval = 1000; // 1秒（ミリ秒）
  result = useRepReactionList(rxNostr, filters, req);
  $: if ($viewEventIds) {
    const currentTimestamp = Date.now();
    if (currentTimestamp - lastUpdateTimestamp > updateInterval) {
      // const eValues: string[] = $viewEvents.reduce((acc: string[], item) => {
      //   if ([7, 6, 16].includes(item.kind)) {
      //     const tag = item.tags.find((tag) => tag[0] === "e");
      //     if (tag) {
      //       acc.push(tag[1]);
      //     }
      //   } else {
      //     acc.push(item.id);
      //   }
      //   return acc;
      // }, []);

      filters = [
        {
          "#e": $viewEventIds,
          authors: [$loginUser],
          kinds: [7, 6, 16], // 明示的に種類を指定
        },
      ];

      lastUpdateTimestamp = currentTimestamp;
      changeEmit(filters);
    }
  }

  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;

  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" {error} />
{:else if $data}
  <slot events={$data.event} {status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
