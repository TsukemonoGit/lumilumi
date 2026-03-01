<!--SetDefaultRelays.svelte-->
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
        return config.read === true;
      }),
    );
  });

  let status: ReqStatus | undefined = $state();
  let mainRelaysInitialized = $state(false);

  // applyRelays: リレーをセットし、接続完了まで待機してから setReady(true) を呼ぶ。
  // 呼び出し元は await して status 更新を行うこと。
  async function applyRelays(
    relays: AcceptableDefaultRelaysConfig,
  ): Promise<void> {
    setRelays(relays);
    relayConnectionState.setReady(false);

    const currentReadRelays = Object.fromEntries(
      Object.entries(get(defo) ?? {}).filter(
        ([_, config]) => config.read === true,
      ),
    );

    await waitForConnections({
      checkrelays: currentReadRelays,
      requiredConnectionRatio: 0.7,
      onProgress: (connected, total) => {
        // 進捗通知のみ。setReady は await 完了後に行う。
        console.debug(`relay connection progress: ${connected}/${total}`);
      },
    });

    // waitForConnections は条件達成・タイムアウトどちらでも resolve する。
    // resolve 後に接続比率を再評価して setReady を確定させる。
    const finalReadRelays = Object.fromEntries(
      Object.entries(get(defo) ?? {}).filter(
        ([_, config]) => config.read === true,
      ),
    );
    const totalCount = Object.keys(finalReadRelays).length;
    // totalCount が 0 の場合は ready とみなす（リレーなし状態）
    relayConnectionState.setReady(true);
  }

  $effect(() => {
    if (paramRelays && paramRelays.length > 0) {
      if (!mainRelaysInitialized) {
        untrack(async () => {
          status = "loading";

          const readEntries = paramRelays!.map((r) => ({
            url: normalizeURL(r),
            read: true,
            write: true,
          }));

          const pubkey = lumiSetting.get().pubkey;

          // 未ログイン：paramRelays をそのまま read/write でセット
          if (!pubkey) {
            try {
              await applyRelays(readEntries);
              status = "success";
            } catch (e) {
              status = "error";
            }
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
            writeRelayConfig = (
              lumiSetting.get().relays as {
                url: string;
                read: boolean;
                write: boolean;
              }[]
            )
              .filter((r) => r.write === true)
              .map((r) => ({
                url: normalizeURL(r.url),
                read: false,
                write: true,
              }));
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
              merged.set(nurl, {
                url: nurl,
                read: false,
                write: true,
              });
            }
          }

          const mergedArray = [...merged.values()];
          console.log("merged before applyRelays:", mergedArray);

          try {
            await applyRelays(mergedArray);
            status = "success";
          } catch (e) {
            status = "error";
          }

          mainRelaysInitialized = true;
        });
      }
      return;
    }

    // paramRelays なし → メインTL用リレーをセット
    untrack(async () => {
      const pubkey = lumiSetting.get().pubkey;
      if (!pubkey) {
        try {
          await applyRelays(defaultRelays);
          status = "success";
        } catch (e) {
          status = "error";
        }
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
                  queryClient.setQueryData(queryKey, packet[0]);
                  // onProgress コールバック内では applyRelays を呼ばない。
                  // result を受け取った後にまとめて処理する。
                }
              },
            );
            if (result.length > 0) {
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
          try {
            await applyRelays(relays);
            status = "success";
          } catch (e) {
            status = "error";
            return;
          }
          mainRelaysInitialized = true;
        } else {
          status = "error";
          return;
        }
      } else {
        try {
          await applyRelays(lumiSetting.get().relays);
          status = "success";
        } catch (e) {
          status = "error";
          return;
        }
        mainRelaysInitialized = true;
      }
    });
  });
</script>

{#if mainRelaysInitialized && Object.keys(timelineRelays).length > 0}
  {@render contents?.()}
{:else if status === "error"}
  {@render error?.(new Error("Failed to load relays"))}
{:else}
  {@render loading?.()}
{/if}
