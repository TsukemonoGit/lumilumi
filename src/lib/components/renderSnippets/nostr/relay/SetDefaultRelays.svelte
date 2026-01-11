<script lang="ts">
  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import {
    type DefaultRelayConfig,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { setRelays } from "$lib/func/nostr";
  import { defaultRelays } from "$lib/stores/relays";
  import { defaultRelays as defo } from "$lib/stores/stores";
  import { app } from "$lib/stores/stores";
  import { get, type Unsubscriber } from "svelte/store";
  import {
    lumiSetting,
    relayConnectionState,
  } from "$lib/stores/globalRunes.svelte";
  import { untrack, type Snippet } from "svelte";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";
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

  let zyouken = $derived(
    localRelays.length > 0 ||
      (paramRelays && paramRelays.length > 0) ||
      !lumiSetting.get().pubkey
  );

  let _relays: DefaultRelayConfig[] | string[] = $derived(
    paramRelays && paramRelays.length > 0
      ? paramRelays
      : localRelays.length > 0
        ? localRelays
        : []
  );

  // TL取得用のリレーのみをフィルタリング
  let timelineRelays = $derived.by(() => {
    if (!$defo) return {};

    return Object.fromEntries(
      Object.entries($defo).filter(([url, config]) => {
        // read: trueのリレーのみ抽出（TL取得用）
        return config.read === true;
      })
    );
  });

  $effect(() => {
    let unsubData: Unsubscriber | undefined;
    let unsubStatus: Unsubscriber | undefined;
    let unsubError: Unsubscriber | undefined;
    if (!zyouken) {
      untrack(() => {
        const result = useRelaySet(queryKey, filters, req);
        unsubData = result?.data.subscribe(
          (value: DefaultRelayConfig[] | null | undefined) => {
            if (value && value.length > 0) {
              data = value;
            }
          }
        );

        unsubStatus = result?.status.subscribe(
          (value: ReqStatus | undefined) => {
            if (value) {
              status = value;
              if (
                value === "success" &&
                (!result?.data || (get(result.data) || []).length <= 0)
              ) {
                setRelays(defaultRelays);
                data = defaultRelays;
              }
            }
          }
        );

        unsubError = result?.error.subscribe((value: Error | null) => {
          if (value) {
            errorData = value;
          }
          if (!data && _relays.length > 0) {
            setRelays(_relays);
          } else if (!data && !lumiSetting.get().pubkey) {
            setRelays(defaultRelays);
          }
        });
      });
    } else if (_relays.length > 0) {
      setRelays(_relays);
    } else if (!lumiSetting.get().pubkey) {
      setRelays(defaultRelays);
    }
    return () => {
      unsubData?.();
      unsubStatus?.();
      unsubError?.();
    };
  });

  let data: DefaultRelayConfig[] | null | undefined | string[] = $state();
  let status: ReqStatus | undefined = $state();
  let errorData: Error | undefined = $state();

  app.subscribe((value) => {
    if (
      value &&
      (localRelays.length > 0 || (paramRelays && paramRelays.length > 0))
    ) {
      console.log(localRelays, paramRelays);
      setRelays(_relays);
    }
  });
</script>

{#if errorData}
  {@render error?.(errorData)}
{:else if Object.keys(timelineRelays).length > 0}
  {#await waitForConnections( { checkrelays: timelineRelays, requiredConnectionRatio: 0.7, onProgress: (connected, total) => {
          setTimeout(() => {
            const ready = total <= 2 ? connected >= 1 : connected / total >= 0.7;
            console.log(ready);
            relayConnectionState.setReady(ready);
          });
        } } )}
    {@render loading?.()}
  {:then}
    {@render contents?.()}
  {:catch e}
    {@render error?.(e)}
  {/await}
{:else if status === "loading"}
  {@render loading?.()}
{/if}
