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
    loading?: Snippet<[string]>;
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

  let timelineRelays = $derived.by(() => {
    if (!$defo) return {};
    return Object.fromEntries(
      Object.entries($defo).filter(([_, config]) => {
        return config.read === true;
      }),
    );
  });

  let status: ReqStatus | undefined = $state();
  let loadingMessage: string = $state("connectingRelay.establishing");
  let mainRelaysInitialized = $state(false);

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
      requiredConnectionRatio: 0.5,
      onProgress: (connected, total) => {
        console.debug(`relay connection progress: ${connected}/${total}`);
      },
    });

    const finalReadRelays = Object.fromEntries(
      Object.entries(get(defo) ?? {}).filter(
        ([_, config]) => config.read === true,
      ),
    );
    const totalCount = Object.keys(finalReadRelays).length;

    if (totalCount === 0) {
      throw new Error("No read relays available after connection attempt");
    }

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

          let writeRelayConfig: {
            url: string;
            read: boolean;
            write: boolean;
          }[] = [];

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
                    }
                  },
                );
                if (result.length > 0) {
                  queryClient.setQueryData(queryKey, result[0]);
                  cachedData = result[0];
                }
              } catch (e) {
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
          // kind:10002 が見つからなかった場合、defaultRelays にフォールバック
          console.warn("kind:10002 not found, falling back to default relays");
          loadingMessage = "connectingRelay.usingDefault";
          try {
            await applyRelays(defaultRelays);
            status = "success";
          } catch (e) {
            status = "error";
            return;
          }
          mainRelaysInitialized = true;
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
  {@render loading?.(loadingMessage)}
{/if}
