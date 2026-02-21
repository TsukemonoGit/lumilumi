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
  import { normalizeURL } from "nostr-tools/utils";

  interface Props {
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
      Object.entries($defo).filter(([_, config]) => {
        return config.read === true; // ← return が欠落していた
      }),
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
    if (paramRelays && paramRelays.length > 0) {
      if (!mainRelaysInitialized) {
        untrack(async () => {
          const readEntries = paramRelays!.map((r) => ({
            url: normalizeURL(r),
            read: true,
            write: true,
          }));

          const pubkey = lumiSetting.get().pubkey;

          // 未ログイン：paramRelays をそのまま read/write でセット
          if (!pubkey) {
            applyRelays(readEntries);
            mainRelaysInitialized = true;
            return;
          }

          // ログイン済み：writeリレーをユーザー設定から取得してマージ
          let writeRelayConfig: {
            url: string;
            read: boolean;
            write: boolean;
          }[] = [];

          if (lumiSetting.get().useRelaySet === "0") {
            // kind:10002 からwriteリレーを取得
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
                      queryClient.setQueryData(queryKey, packet[0]);
                    }
                  },
                );
                if (result.length > 0) {
                  queryClient.setQueryData(queryKey, result[0]);
                  cachedData = result[0];
                }
              } catch (e) {
                // フェッチ失敗時はwriteなしで続行
                console.warn(
                  "kind:10002 fetch failed, proceeding without write relays",
                  e,
                );
              }
            }

            if (cachedData) {
              const relays = setRelaysByKind10002(cachedData.event);
              writeRelayConfig = (
                relays as { url: string; read: boolean; write: boolean }[]
              )
                .filter((r) => r.write === true)
                .map((r) => ({
                  url: normalizeURL(r.url),
                  read: false,
                  write: true,
                }));
            }
          } else {
            // useRelaySet === "1"：lumiSetting のリレーセットからwriteのみ抽出
            writeRelayConfig = Object.entries(lumiSetting.get().relays)
              .filter(([_, config]) => config.write === true)
              .map(([url]) => ({
                url: normalizeURL(url),
                read: false,
                write: true,
              }));
            console.log(writeRelayConfig);
          }

          // read（paramRelays）＋ write（ユーザー設定）をマージ
          // 同一URLが両方に存在する場合は read: true, write: true にまとめる
          const merged = new Map<
            string,
            { url: string; read: boolean; write: boolean }
          >();

          for (const entry of readEntries) {
            merged.set(entry.url, { ...entry });
          }

          for (const entry of writeRelayConfig) {
            const nurl = normalizeURL(entry.url);
            if (merged.has(nurl)) {
              merged.get(nurl)!.write = true;
            } else {
              // read: false のまま追加（writeのみのリレー）
              merged.set(nurl, {
                url: nurl,
                read: false,
                write: true,
              });
            }
          }

          const mergedArray = [...merged.values()];
          console.log("merged before applyRelays:", mergedArray);
          applyRelays(mergedArray);

          mainRelaysInitialized = true;
        });
      }
      return;
    }

    // paramRelays なし → メインTL用リレーをセット
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
