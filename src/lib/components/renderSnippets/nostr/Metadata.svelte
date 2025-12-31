<!--Metadata.svelte-->
<script lang="ts">
  //proxyをあれするやつ
  import { useMetadata } from "$lib/stores/useMetadata";
  import type { ReqStatus } from "$lib/types";
  import { app } from "$lib/stores/stores";

  import { type QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import {
    type EventPacket,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { getMetadata } from "$lib/func/nostr";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { untrack, type Snippet } from "svelte";

  interface Props {
    queryKey: QueryKey;
    pubkey: string;
    req?:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    error?: Snippet<[Error]>;
    nodata?: Snippet;
    loading?: Snippet;

    content?: Snippet<[{ metadata: Nostr.Event; status: ReqStatus }]>;
    onChange?: (metadata: Nostr.Event) => void;
  }
  let {
    req = undefined,
    pubkey,
    queryKey,

    error,
    loading,
    nodata,
    content,
    onChange,
  }: Props = $props();

  //let initialDataUpdatedAt: number;
  const staleTime: number = Infinity;
  let refetchInterval: number = Infinity;
  //initialEataのUpdatedAtを古めにしておいてstaleTimeはちょっと長めにしておくことで、とりあえず前回の最新メタデータを表示しておいて後々最新のMetadataを取ってくることができる？
  let localData = $derived(getMetadata(queryKey));
  //console.log(localData);
  let initData: EventPacket | undefined = $derived(
    lumiSetting.get().showImg ? undefined : localData
  ); //画像オンのときは初っ端最新チェックなのでinitDataいらないけど代わりにローディングのときとかにおいてみる

  let result = $derived(
    useMetadata(
      $app.rxNostr,
      queryKey,
      pubkey,
      req,
      initData,
      staleTime,
      undefined,
      refetchInterval
    )
  );

  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);

  let metadata = $derived.by(() => {
    const localEvent = localData?.event;
    const remoteEvent = $data?.event;

    if (!remoteEvent) return localEvent;
    if (!localEvent) return remoteEvent;

    return localEvent.created_at > remoteEvent.created_at
      ? localEvent
      : remoteEvent;
  });

  $effect(() => {
    if (metadata) {
      untrack(() => onChange?.(metadata));
    }
  });
</script>

{#if metadata}
  {@render content?.({ metadata: metadata, status: $status })}
{:else if $errorData}
  {@render error?.($errorData)}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
