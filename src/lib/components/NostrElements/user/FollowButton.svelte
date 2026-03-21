<script lang="ts">
  import {
    pubkeysIn,
    usePromiseReq,
    promisePublishSignedEvent,
    makeMainFilters,
    changeMainEmit,
  } from "$lib/func/nostr";
  import { nowProgress, queryClient } from "$lib/stores/stores";
  import {
    nip07Signer,
    type EventPacket,
    type OkPacketAgainstEvent,
    now,
  } from "rx-nostr";
  import { t as _, locale } from "@konemono/svelte5-i18n";
  import * as Nostr from "nostr-typedef";

  import {
    datetime,
    formatAbsoluteDateFromUnix,
    formatRelativeDate,
    formatToEventPacket,
    generateResultMessage,
  } from "$lib/func/util";
  import { ArrowBigDown } from "lucide-svelte";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import { pipe } from "rxjs";
  import { latest } from "rx-nostr/src";
  import { type QueryKey } from "@tanstack/svelte-query";
  import { validateLoginPubkey } from "$lib/func/validateLoginPubkey";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  import { addToast } from "$lib/components/Elements/Toast.svelte";
  import { STORAGE_KEYS, getKind3Key } from "$lib/func/localStorageKeys";

  interface Props {
    pubkey: string;
  }

  let { pubkey }: Props = $props();

  let beforeKind3: Nostr.Event | undefined = $state();
  let afterEventParameters: Nostr.EventParameters | undefined = $state();

  // svelte-ignore non_reactive_update
  let dialogOpen = $state(false);

  let contactsQueryKey: QueryKey = $derived([
    "naddr",
    `${3}:${lumiSetting.get().pubkey}:`,
  ]);
  let isfollowee: boolean = $derived(followList.get().has(pubkey));

  // Public key validation
  const CheckLoginPubkey = async (): Promise<boolean> => {
    const res = await validateLoginPubkey();
    if (res.status) {
      return true;
    } else if (res.message) {
      showToast("Error", res.message, "bg-red-500");
    }
    return false;
  };

  // Show toast notification
  const showToast = (title: string, description: string, color: string) => {
    addToast({
      data: { title, description, color },
    });
  };

  let dialogCreateKind3Open = $state(false);

  // Handle follow/unfollow logic
  const handleFollow = async () => {
    if (!(await CheckLoginPubkey())) return;

    const followState = followList.get().has(pubkey);
    const kind3Event: EventPacket | undefined =
      queryClient.getQueryData(contactsQueryKey); //この時点ではまだfollowList.get()を持っていない可能性があるので取得する

    await refreshContactsData(kind3Event);

    if (!beforeKind3) {
      //新しいKind3作っていいですかを出す
      dialogCreateKind3Open = true;
      return;
    }

    //isfollowee = followList.get().get.has(pubkey);

    if (followState !== followList.get().has(pubkey)) {
      $nowProgress = false;
      return;
    }

    handleFollowStateChange();
  };

  const refreshContactsData = async (kind3Event: EventPacket | undefined) => {
    $nowProgress = true;

    // クリア前のキャッシュデータを保存
    const cachedKind3: EventPacket | undefined =
      queryClient.getQueryData(contactsQueryKey);

    console.log(
      "[FollowButton] Cached Kind 3:",
      cachedKind3?.event.created_at
        ? new Date(cachedKind3.event.created_at * 1000).toISOString()
        : "no cache",
    );

    // キャッシュをクリアして最新データを強制取得
    queryClient.removeQueries({ queryKey: contactsQueryKey });

    console.log("[FollowButton] Fetching latest Kind 3 contacts...");
    const newKind3: EventPacket[] = await usePromiseReq(
      {
        filters: [
          { kinds: [3], authors: [lumiSetting.get().pubkey], limit: 1 },
        ],
        operator: pipe(latest()),
      },
      undefined,
      5000, // タイムアウトを5000msに延長
    );

    console.log(
      "[FollowButton] Network fetch result:",
      newKind3.length > 0
        ? {
            created_at: new Date(
              newKind3[0].event.created_at * 1000,
            ).toISOString(),
            p_tags_count: newKind3[0].event.tags.filter((t) => t[0] === "p")
              .length,
          }
        : "no data from network",
    );

    // ネットワークから取得したデータとキャッシュを比較
    let selectedKind3: Nostr.Event | undefined;

    if (newKind3.length > 0) {
      const networkTimestamp = newKind3[0].event.created_at;
      const cachedTimestamp = cachedKind3?.event.created_at || 0;

      if (networkTimestamp > cachedTimestamp) {
        // ネットワークデータの方が新しい
        selectedKind3 = newKind3[0].event;
        console.log("[FollowButton] Using network data (newer)");
      } else if (cachedKind3) {
        // キャッシュの方が新しい
        selectedKind3 = cachedKind3.event;
        console.log("[FollowButton] Using cached data (newer)");
        // キャッシュを復元
        queryClient.setQueryData(
          contactsQueryKey,
          (oldData: any) => cachedKind3,
        );
      } else {
        // キャッシュなし、ネットワークデータを使用
        selectedKind3 = newKind3[0].event;
        console.log("[FollowButton] Using network data (no cache)");
      }
    } else if (cachedKind3) {
      // ネットワークから取得できず、キャッシュを使用
      selectedKind3 = cachedKind3.event;
      console.log("[FollowButton] Using cached data (network failed)");
      // キャッシュを復元
      queryClient.setQueryData(contactsQueryKey, (oldData: any) => cachedKind3);
    }

    if (selectedKind3) {
      beforeKind3 = selectedKind3;
      const pubkeyList = pubkeysIn(selectedKind3);
      followList.set(pubkeyList);

      // ローカルストレージに保存
      try {
        const kind3Key = getKind3Key(lumiSetting.get().pubkey);
        localStorage.setItem(kind3Key, JSON.stringify(selectedKind3));
        console.log("[FollowButton] Kind 3 saved to localStorage");
      } catch (error) {
        console.error(
          "[FollowButton] Failed to save Kind 3 to localStorage:",
          error,
        );
      }

      console.log("[FollowButton] Final Kind 3 selected:", {
        timestamp: new Date(selectedKind3.created_at * 1000).toISOString(),
        p_tags_count: selectedKind3.tags.filter((t) => t[0] === "p").length,
      });
    } else {
      console.warn("[FollowButton] No Kind 3 data available");
    }
  };

  const handleFollowStateChange = () => {
    const snapbefore = $state.snapshot(beforeKind3);
    if (!snapbefore) return;

    const tags = isfollowee
      ? snapbefore.tags.filter(
          ([tagName, pub]) => !(tagName === "p" && pub === pubkey),
        )
      : [...snapbefore.tags, ["p", pubkey]];

    afterEventParameters = {
      content: snapbefore.content,
      tags,
      kind: 3,
      pubkey: snapbefore.pubkey,
    };

    $nowProgress = false;
    dialogOpen = true;
  };

  // Handle event publishing
  const publishEvent = async () => {
    dialogOpen = false;
    $nowProgress = true;
    //kind3の更新はrelaySearchRelaysにも投げる（kind3,10002,kind0なんかそのへん特化（kind:3含むとこだけにする））

    try {
      const result = await safePublishEvent(
        $state.snapshot(afterEventParameters) as Nostr.Event,
      );

      if ("errorCode" in result) {
        if (result.isCanceled) {
          return; // キャンセル時は何もしない
        }
        showToast("Failed", $_(result.errorCode), "bg-red-500");
        return;
      }

      // 成功時の処理
      handlePublishResult(result.res, result.event);
    } finally {
      $nowProgress = false;
    }
  };

  const handlePublishResult = (
    res: OkPacketAgainstEvent[],
    ev: Nostr.Event,
  ) => {
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
    const message = generateResultMessage(isSuccess, isFailed);

    showToast(
      isSuccess.length > 0 ? "Success" : "Failed",
      message,
      isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
    );

    if (isSuccess.length > 0) {
      //queryClient.refetchQueries({ queryKey: contactsQueryKey }); //これやったらnullになるはなおってるかもだけど別にリフェッチしなくていいか

      const packetEv = formatToEventPacket(ev, isSuccess[0]);

      queryClient.setQueryData(contactsQueryKey, packetEv);

      const pubkeyList = pubkeysIn(ev);
      followList.set(pubkeyList);

      const filters = makeMainFilters(ev, now());
      changeMainEmit(filters.mainFilters);
    }

    //  isfollowee = followList.get().get.has(pubkey);
    resetState();
  };

  const resetState = () => {
    beforeKind3 = undefined;
    afterEventParameters = undefined;
    $nowProgress = false;
  };

  // Handle petname dialog
  let openPetnameDialog = $state(false);
  let petnameInput: string = $state("");

  const handlePetnameClick = async () => {
    let kind3Event: EventPacket | undefined =
      queryClient.getQueryData(contactsQueryKey);
    await refreshContactsData(kind3Event);
    petnameInput = followList.get().get(pubkey) ?? "";
    openPetnameDialog = true;
    $nowProgress = false;
  };

  const updatePetname = async () => {
    if (!beforeKind3) return;

    const beforePetname = followList.get().get(pubkey);
    if (
      (!beforePetname && petnameInput === "") ||
      beforePetname === petnameInput
    )
      return;

    const updatedTags = beforeKind3.tags.map((tag) => {
      if (tag[0] === "p" && tag[1] === pubkey) {
        return petnameInput === ""
          ? tag.slice(0, 3)
          : tag.length > 2
            ? [...tag.slice(0, 3), petnameInput]
            : ["p", pubkey, "", petnameInput];
      }
      return tag;
    });

    afterEventParameters = {
      content: beforeKind3.content,
      tags: updatedTags,
      kind: 3,
      pubkey: beforeKind3.pubkey,
    };
    publishEvent();
    openPetnameDialog = false;
  };

  const onClickOK = async () => {
    console.log("onClickOK");
    dialogCreateKind3Open = false;
    $nowProgress = true;
    const ev: Nostr.EventParameters = {
      kind: 3,
      content: "",
      tags: [
        ["p", lumiSetting.get().pubkey],
        ["p", pubkey],
      ],
    };
    const signer = nip07Signer();
    try {
      const event = await signer.signEvent(ev);
      if (event.pubkey !== lumiSetting.get().pubkey) {
        addToast({
          data: {
            title: "Error",
            description: "login pubkey ≠ sign pubkey",
            color: "bg-red-500",
          },
        });
        $nowProgress = false;
        return;
      } else {
        const { event: ev, res } = await promisePublishSignedEvent(event);
        const isSuccessRelays: OkPacketAgainstEvent[] = res.filter(
          (item) => item.ok,
        );

        if (isSuccessRelays.length <= 0) {
          addToast({
            data: {
              title: "Failed",
              description: "failed to publish",
              color: "bg-red-500",
            },
          });
        }
      }
    } catch (error) {
      addToast({
        data: {
          title: "Failed",
          description: "failed to sign event",
          color: "bg-red-500",
        },
      });
    }
    $nowProgress = false;
  };
</script>

{#if lumiSetting.get().pubkey && isfollowee !== undefined}
  {#if isfollowee}
    <button
      disabled={$nowProgress}
      class={`rounded-full h-[32px] w-[32px] border border-magnum-300 break-keep disabled:opacity-25 font-medium leading-none text-magnum-300 bg-zinc-800 shadow hover:opacity-60 `}
      title={$_("user.petname.edit")}
      onclick={handlePetnameClick}
    >
      📛
    </button>
    <button
      disabled={$nowProgress}
      class={`rounded-full h-[32px] border border-magnum-300 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-300 bg-zinc-800 shadow hover:opacity-60 `}
      onclick={handleFollow}
    >
      {$_("user.following")}
    </button>
  {:else}
    <button
      disabled={$nowProgress}
      class={`rounded-full bg-white border border-magnum-700 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-700 shadow hover:opacity-60 h-[32px] `}
      onclick={handleFollow}
    >
      {$_("user.follow")}
    </button>
  {/if}
{/if}
<AlertDialog
  bind:open={dialogOpen}
  onClickOK={publishEvent}
  title={$_("user.followList.update")}
>
  {#snippet main()}
    <div>
      <div class="text-magnum-500 font-bold text-lg mt-2">Before</div>
      {#if beforeKind3}
        <div
          class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
        >
          <ul class="leading-4">
            <li>
              Updated at <time
                class="font-semibold text-magnum-300"
                datetime={datetime(beforeKind3?.created_at)}
                >{formatAbsoluteDateFromUnix(
                  beforeKind3?.created_at,
                  true,
                )}</time
              ><span class="ml-2"
                >({formatRelativeDate(beforeKind3?.created_at, $locale)})</span
              >
            </li>
            <li>
              List length <span class="font-semibold text-zinc-200"
                >{beforeKind3?.tags.length}</span
              >
            </li>
            <li>
              Followee <span class="font-semibold text-zinc-200"
                >{beforeKind3?.tags?.reduce((acc, [tag, value]) => {
                  if (tag === "p") {
                    return [...acc, value];
                  } else {
                    return acc;
                  }
                }, []).length}</span
              >
            </li>
          </ul>
        </div>
      {/if}
      {#if afterEventParameters}
        <ArrowBigDown />
        <div class="text-magnum-500 font-bold text-lg mt-2">After</div>
        <div
          class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
        >
          <ul class="leading-4">
            <li>
              List length <span class="font-semibold text-magnum-300"
                >{afterEventParameters?.tags?.length}</span
              >
            </li>
            <li>
              Followee <span class="font-semibold text-magnum-300"
                >{afterEventParameters?.tags?.reduce((acc, [tag, value]) => {
                  if (tag === "p") {
                    return [...acc, value];
                  } else {
                    return acc;
                  }
                }, []).length}</span
              >
            </li>
          </ul>
        </div>
      {/if}
    </div>
  {/snippet}
</AlertDialog>

<AlertDialog
  bind:open={openPetnameDialog}
  onClickOK={updatePetname}
  title={$_("user.petname.petname")}
  okButtonName="OK"
>
  {#snippet main()}
    <div>
      {#if beforeKind3}
        <div class="flex flex-col items-start justify-center">
          <p class="font-medium text-magnum-400">
            {$_("user.petname.write")} (NIP-02)
          </p>
          <p class="font-medium text-sm text-magnum-400">
            {$_("user.petname.warning")}
          </p>
          <input
            type="text"
            class="h-10 w-full rounded-md px-3 py-2 mt-2 border border-magnum-600 bg-neutral-900"
            bind:value={petnameInput}
          />
        </div>
        <div class="text-sm mt-6 bg-neutral-700 rounded-sm p-2">
          Follow List Updated at<time
            class="font-semibold text-magnum-300 ml-2"
            datetime={datetime(beforeKind3?.created_at)}
            >{formatAbsoluteDateFromUnix(beforeKind3?.created_at, true)}</time
          >
          ({formatRelativeDate(beforeKind3?.created_at, $locale)})
        </div>
      {/if}
    </div>
  {/snippet}
</AlertDialog>

<AlertDialog
  bind:open={dialogCreateKind3Open}
  {onClickOK}
  title={$_("create_kind3.create")}
  >{#snippet main()}
    <div class=" text-neutral-200 whitespace-pre-wrap">
      {$_("create_kind3.newMessage")}
    </div>
  {/snippet}</AlertDialog
>
