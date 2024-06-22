<script lang="ts">
  import { unsubscribe, useTimelineElement } from "$lib/func/nostr";

  import type { ReqResult, ReqStatus, RxReqBase } from "$lib/types";
  import * as Nostr from "nostr-typedef";
  import {
    createRxForwardReq,
    createUniq,
    verify,
    type EventPacket,
  } from "rx-nostr";
  import { writable } from "svelte/store";

  import { pipe } from "rxjs";
  import { scanArray } from "$lib/stores/operators";
  import { beforeNavigate } from "$app/navigation";

  export let key: string;
  export let filters: Nostr.Filter[];
  export let req: RxReqBase | undefined = undefined;

  export let viewIndex: number;
  export let amount: number;

  // イベントID に基づいて重複を排除する
  const keyFn = (packet: EventPacket): string => packet.event.id;

  const onCache = (packet: EventPacket): void => {
    // console.log(`${packet.id} を初めて観測しました`);
  };
  const onHit = (packet: EventPacket): void => {
    //  console.log(`${packet.id} はすでに観測されています`);
  };

  const [uniq, eventIds] = createUniq(keyFn, { onCache, onHit });

  const operator = pipe(uniq, verify(), scanArray());
  $: result = useTimelineElement({
    queryKey: key,
    filters,
    req: req,
    operator,
  }) as ReqResult<EventPacket[]>;

  $: data = result.data;
  $: status = result.status;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus; len: number };

    nodata: Record<never, never>;
  }

  beforeNavigate(() => {
    console.log("unsubsuclibe");
    unsubscribe();
  });
</script>

{#if $data && $data?.length > 0}
  <slot
    events={$data?.map(({ event }) => event)}
    status={$status}
    len={$data.length}
  />
{:else}
  <slot name="nodata" />
{/if}
