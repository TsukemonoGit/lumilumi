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
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { untrack, type Snippet } from "svelte";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";

  interface Props {
    // pubkey: string;
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
    //relayChange: (data: string[]) => void;
    error?: Snippet<[Error]>;

    loading?: Snippet;

    contents?: Snippet;
  }
  let {
    req = undefined,
    // pubkey,
    localRelays,
    paramRelays = undefined,
    // relayChange,
    error,
    loading,
    contents,
  }: Props = $props();
  let pubkey = lumiSetting.get().pubkey;
  let queryKey = ["defaultRelay", pubkey];
  let filters = [
    // { authors: [pubkey], kinds: [3], limit: 1 },
    { authors: [pubkey], kinds: [10002], limit: 1 },
  ] as Nostr.Filter[];

  //パラムリレーがあったりlocalリレーがあるときはそれを返す。なくて、ログインしてるときに10002とる。ログインしてなかったらデフォリレーをセットする。

  let zyouken = $derived(
    localRelays.length > 0 ||
      (paramRelays && paramRelays.length > 0) ||
      !lumiSetting.get().pubkey
  );
  // console.log(zyouken);
  let _relays: DefaultRelayConfig[] | string[] = $derived(
    paramRelays && paramRelays.length > 0 //neventとかのやつ
      ? paramRelays
      : localRelays.length > 0 //設定でローカルのリレー使うことにしてるときのやつ
        ? localRelays
        : []
  );

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
            //neventとかじゃなくてリレーなくてログインもしてなかったらデフォリレー
            setRelays(defaultRelays);
          }
        });
      });
    } else if (_relays.length > 0) {
      setRelays(_relays);
    } else if (!lumiSetting.get().pubkey) {
      //neventとかじゃなくてリレーなくてログインもしてなかったらデフォリレー
      setRelays(defaultRelays);
    }
    // クリーンアップ
    return () => {
      unsubData?.();
      unsubStatus?.();
      unsubError?.();
    };
  });

  let data: DefaultRelayConfig[] | null | undefined | string[] = $state();
  let status: ReqStatus | undefined = $state();
  let errorData: Error | undefined = $state();

  // relay connection progress for UI
  let relayConnected: number = $state(0);
  let relayTotal: number = $state(0);

  // computed percent (0..100). If no relays configured (total === 0), treat as 100% ready.
  let relayPercent: number = $derived(
    relayTotal
      ? Math.round((relayConnected / relayTotal) * 100)
      : relayTotal === 0
        ? 100
        : 0
  );

  app.subscribe((value) => {
    // console.log(value, localRelays, paramRelays);
    if (
      value &&
      (localRelays.length > 0 || (paramRelays && paramRelays.length > 0))
    ) {
      //localかparamにリレーがあるときは10002じゃなくてlocalかparamのリレーがセットされるところ

      console.log(localRelays, paramRelays);
      setRelays(_relays);
    }
  });
</script>

{#if errorData}
  {@render error?.(errorData)}
{:else if $defo && Object.values($defo).length > 0}
  {#await waitForConnections( { requiredConnectionRatio: 0.5, onProgress: (connected, total) => {
          setTimeout(() => {
            relayConnected = connected;
            relayTotal = total;
          });
        } } )}
    <div class="relay-progress">
      {@render loading?.()}
      <div
        class="progress-bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={relayPercent}
        aria-label="Relay connection progress"
      >
        <div class="progress-fill" style={`width: ${relayPercent}%`}></div>
      </div>
      <div class="progress-text">
        Connecting to relays{relayTotal
          ? ` (${relayConnected}/${relayTotal}) ${relayPercent}%`
          : ""}
      </div>
    </div>
  {:then}
    {@render contents?.()}
  {:catch e}
    {@render error?.(e)}
  {/await}
{:else if status === "loading"}
  {@render loading?.()}
{/if}

<style>
  .relay-progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 9999px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed, #06b6d4);
    width: 0%;
    transition: width 300ms ease;
  }
  .progress-text {
    font-size: 0.875rem;
    color: var(--color-magnum-50, #f8fafc);
  }
</style>
