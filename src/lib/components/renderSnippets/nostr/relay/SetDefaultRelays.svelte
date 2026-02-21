<script lang="ts">
  import { setRelaysByKind10002 } from "$lib/stores/useRelaySet";
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import {
    type DefaultRelayConfig,
    type EventPacket,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
    latest,
    uniq,
  } from "rx-nostr";
  import { pipe } from "rxjs";
  import { setRelays, usePromiseReq } from "$lib/func/nostr";
  import { defaultRelays } from "$lib/stores/relays";
  import { defaultRelays as defo, queryClient } from "$lib/stores/stores";
  import { app } from "$lib/stores/stores";
  import {
    lumiSetting,
    relayConnectionState,
  } from "$lib/stores/globalRunes.svelte";
  import { untrack, type Snippet } from "svelte";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";
  import type { AcceptableDefaultRelaysConfig } from "rx-nostr";
  import { get } from "svelte/store";

  interface Props {
    localRelays: DefaultRelayConfig[];
    paramRelays: string[] | undefined;
    req?:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    error?: Snippet<[Error]>;
    loading?: Snippet;
    contents?: Snippet;
  }

  let {
    req = undefined,
    localRelays,
    paramRelays = undefined,
    error,
    loading,
    contents,
  }: Props = $props();

  let pubkey = lumiSetting.get().pubkey;
  let queryKey = ["defaultRelay", pubkey];
  let filters = [
    { authors: [pubkey], kinds: [10002], limit: 1 },
  ] as Nostr.Filter[];

  // TL取得用のリレーのみをフィルタリング（read: true のもの）
  let timelineRelays = $derived.by(() => {
    if (!$defo) return {};
    return Object.fromEntries(
      Object.entries($defo).filter(([_, config]) => config.read === true),
    );
  });

  let connectionPromise: Promise<void> = $state(Promise.resolve());
  let status: ReqStatus | undefined = $state();
  let mainRelaysInitialized = $state(false);

  function applyRelays(relays: AcceptableDefaultRelaysConfig) {
    setRelays(relays);
    relayConnectionState.setReady(false); // リセット
    const currentReadRelays = Object.fromEntries(
      Object.entries(get(defo) ?? {}).filter(
        ([_, config]) => config.read === true,
      ),
    );
    connectionPromise = waitForConnections({
      checkrelays: currentReadRelays,
      requiredConnectionRatio: 0.7,
      onProgress: (connected, total) => {
        setTimeout(() => {
          const ready = total <= 2 ? connected >= 1 : connected / total >= 0.7;
          relayConnectionState.setReady(ready);
        });
      },
    });
  }

  $effect(() => {
    // neventページ等で paramRelays が存在する場合
    if (paramRelays && paramRelays.length > 0) {
      if (!mainRelaysInitialized) {
        // 直接アクセス：paramRelays を一時セット
        untrack(() =>
          applyRelays(
            paramRelays!.map((r) => ({ url: r, read: true, write: false })),
          ),
        );
      }
      // mainRelaysInitialized === true なら何もしない（メインTL用を維持）
      return;
    }

    // root または paramRelays なし
    // → メインTL用リレーをセット
    untrack(async () => {
      const pubkey = lumiSetting.get().pubkey;
      if (!pubkey) {
        applyRelays(defaultRelays);
        mainRelaysInitialized = true;
        return;
      }
      status = "loading";
      if (lumiSetting.get().useRelaySet === "0") {
        let cachedData: EventPacket | undefined | null =
          queryClient.getQueryData(queryKey);
        if (!cachedData) {
          $app.rxNostr.setDefaultRelays(defaultRelays);

          try {
            const result = await usePromiseReq(
              { filters, operator: pipe(uniq(), latest()), req },
              defaultRelays,
              3000,
              (packet: EventPacket[]) => {
                if (packet.length > 0) {
                  const relays = setRelaysByKind10002(packet[0].event);
                  applyRelays(relays);
                  queryClient.setQueryData(queryKey, packet[0]);
                  mainRelaysInitialized = true;
                  status = "success";
                }
              },
            );
            if (result.length > 0 && !mainRelaysInitialized) {
              queryClient.setQueryData(queryKey, result[0]);
              cachedData = result[0];
            }
          } catch (e) {
            status = "error";
            return;
          }
        }
        if (cachedData) {
          const relays = setRelaysByKind10002(cachedData.event);
          applyRelays(relays);
          mainRelaysInitialized = true;
        }
      } else {
        applyRelays(lumiSetting.get().relays);
        mainRelaysInitialized = true;
      }
      status = "success";
    });
  });
</script>

{#if status === "error"}
  {@render error?.(new Error("Failed to load relays"))}
{:else if Object.keys(timelineRelays).length > 0}
  {#await connectionPromise}
    {@render loading?.()}
  {:then}
    {@render contents?.()}
  {:catch e}
    {@render error?.(e)}
  {/await}
{:else if status === "loading"}
  {@render loading?.()}
{/if}
