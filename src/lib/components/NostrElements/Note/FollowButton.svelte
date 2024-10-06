<script lang="ts">
  import { pubkeysIn, promisePublishEvent } from "$lib/func/nostr";
  import {
    followList,
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { type EventPacket } from "rx-nostr";
  import { _, locale } from "svelte-i18n";

  import * as Nostr from "nostr-typedef";
  import { writable } from "svelte/store";
  import {
    datetime,
    formatAbsoluteDate,
    formatRelativeDate,
    generateResultMessage,
  } from "$lib/func/util";
  import { ArrowBigDown } from "lucide-svelte";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";

  export let pubkey: string;

  const beforeKind3 = writable<Nostr.Event | undefined>();
  const afterEventParameters = writable<Nostr.EventParameters | undefined>();
  let dialogOpen: any;

  $: isfollowee = $followList.has(pubkey);

  const handleClickFollow = async () => {
    console.log("mada");
    if ($loginUser === "") return;
    try {
      const signPubkey = await (
        window.nostr as Nostr.Nip07.Nostr
      )?.getPublicKey();
      if ($loginUser !== signPubkey) {
        $toastSettings = {
          title: "Error",
          description: "login pubkey ≠ sign pubkey",
          color: "bg-red-500",
        };
        return;
      }
    } catch (error) {
      $toastSettings = {
        title: "Error",
        description: "failed to get sign pubkey",
        color: "bg-red-500",
      };
      return;
    }
    const followState = $followList.has(pubkey);
    let kind3Event: EventPacket | undefined = $queryClient.getQueryData([
      "timeline",
      "contacts",
      $loginUser,
    ]);
    console.log(kind3Event);

    if (!kind3Event) return;

    $nowProgress = true;
    const newkind3: EventPacket | undefined = await $queryClient.fetchQuery({
      queryKey: ["timeline", "contacts", $loginUser],
    });

    if (newkind3) {
      if (newkind3.event.created_at > kind3Event.event.created_at) {
        kind3Event = newkind3;
        pubkeysIn(kind3Event.event); // pubkeyリストを更新する
      }
      //Contactsの方で新しいデータ受信したらlocalStorageに入るようになってるはず
      //だからlocalstrageにあるデータが最新データ
    }

    $beforeKind3 = kind3Event.event;

    isfollowee = $followList.has(pubkey);
    console.log(kind3Event);

    if (followState !== isfollowee) {
      $nowProgress = false;
      return;
    }

    handleFollowStateChange();
  };

  const handleFollowStateChange = () => {
    if (!$beforeKind3) {
      return;
    }
    if (isfollowee) {
      // 最新イベントでもフォローされた状態だからフォロー外す
      const tags = $beforeKind3.tags.filter(
        ([tagName, pub]) => !(tagName === "p" && pub === pubkey)
      );
      $afterEventParameters = {
        content: $beforeKind3.content,
        tags: tags,
        kind: 3,
        pubkey: $beforeKind3.pubkey,
      };
    } else {
      // 最新イベントでもフォローされてない状態だからフォローする
      const tags = [...$beforeKind3.tags, ["p", pubkey]];
      $afterEventParameters = {
        content: $beforeKind3.content,
        tags: tags,
        kind: 3,
      };
    }
    console.log(isfollowee);
    $nowProgress = false;
    $dialogOpen = true;
  };

  const onClickOK = async () => {
    console.log("close");
    $dialogOpen = false;
    $nowProgress = true;

    const { event: ev, res } = await promisePublishEvent(
      $afterEventParameters as Nostr.Event
    );
    console.log(res);

    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);

    let str = generateResultMessage(isSuccess, isFailed);
    console.log(str);

    $toastSettings = {
      title: isSuccess.length > 0 ? "Success" : "Failed",
      description: str,
      color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
    };

    if (isSuccess.length > 0) {
      $queryClient.refetchQueries({
        queryKey: ["timeline", "contacts", $loginUser],
      });

      pubkeysIn(ev); // pubkeyリストを更新する
    }

    isfollowee = $followList.has(pubkey);
    resetState();
  };

  const resetState = () => {
    $beforeKind3 = undefined;
    $afterEventParameters = undefined;
    $nowProgress = false;
  };

  // async function updateKind3(): Promise<EventPacket[]> {
  //   const newReq = createRxBackwardReq();
  //   const operator = pipe(latest());
  //   const filters = [{ kinds: [3], authors: [$loginUser], limit: 1 }];

  //   const newkind3: EventPacket[] = await usePromiseReq(
  //     {
  //       operator,
  //       queryKey: ["timeline", "contacts", $loginUser],
  //       filters,
  //       req: newReq,
  //     },
  //     undefined
  //   );
  //   console.log("length", newkind3.length);
  //   console.log("list", newkind3);
  //   return newkind3;
  // }
  let openPetnameDialog:
    | {
        update: (
          updater: import("svelte/store").Updater<boolean>,
          sideEffect?: ((newValue: boolean) => void) | undefined
        ) => void;
        set: (this: void, value: boolean) => void;
        subscribe(
          this: void,
          run: import("svelte/store").Subscriber<boolean>,
          invalidate?: import("svelte/store").Invalidator<boolean> | undefined
        ): import("svelte/store").Unsubscriber;
        get: () => boolean;
        destroy?: (() => void) | undefined;
      }
    | undefined;
  let petnameInput: string = "";
  const handleClickPetname = async () => {
    let kind3Event: EventPacket | undefined = $queryClient.getQueryData([
      "timeline",
      "contacts",
      $loginUser,
    ]);
    console.log(kind3Event);

    $nowProgress = true;
    const newkind3: EventPacket | undefined = await $queryClient.fetchQuery({
      queryKey: ["timeline", "contacts", $loginUser],
    });

    if (newkind3) {
      if (
        !kind3Event ||
        newkind3.event.created_at > kind3Event.event.created_at
      ) {
        kind3Event = newkind3;
        pubkeysIn(kind3Event.event); // pubkeyリストを更新する
      }
      //Contactsの方で新しいデータ受信したらlocalStorageに入るようになってるはず
      //だからlocalstrageにあるデータが最新データ
    }

    $beforeKind3 = kind3Event?.event;
    petnameInput = $followList.get(pubkey) ?? "";
    isfollowee = $followList.has(pubkey);

    $openPetnameDialog = true;
    $nowProgress = false;
  };

  const onClickOKPetname = async () => {
    if (!$beforeKind3) {
      $openPetnameDialog = false;
      return;
    }
    //if(petnameInput==="")もともとペットネームがついている場合削除する。ついてない場合何もしない
    //まず現状のpetnameを調べる
    const beforepetname = $followList?.get(pubkey);
    if (
      (!beforepetname && petnameInput === "") ||
      beforepetname === petnameInput
    ) {
      return;
    } //変更がない場合
    // tagsの更新処理
    const updatedTags = $beforeKind3.tags.map((tag) => {
      // "p" タグを見つけた場合
      if (tag[0] === "p" && tag[1] === pubkey) {
        // petnameが空であれば["p", pubkey]、そうでなければ["p", pubkey, petnameInput]
        return petnameInput === ""
          ? ["p", pubkey]
          : ["p", pubkey, petnameInput];
      }
      return tag; // それ以外のタグはそのまま
    });
    $afterEventParameters = {
      content: $beforeKind3.content,
      tags: updatedTags,
      kind: 3,
      pubkey: $beforeKind3.pubkey,
    };

    const { event: ev, res } = await promisePublishEvent(
      $afterEventParameters as Nostr.Event
    );
    console.log(res);

    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);

    let str = generateResultMessage(isSuccess, isFailed);
    console.log(str);

    $toastSettings = {
      title: isSuccess.length > 0 ? "Success" : "Failed",
      description: str,
      color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
    };

    if (isSuccess.length > 0) {
      $queryClient.refetchQueries({
        queryKey: ["timeline", "contacts", $loginUser],
      });

      pubkeysIn(ev); // pubkeyリストを更新する
    }

    resetState();
    $openPetnameDialog = false;
    console.log(petnameInput);
  };
</script>

{#if isfollowee !== undefined}
  {#if isfollowee}
    <button
      disabled={$nowProgress}
      class={`rounded-full h-[32px] w-[32px] border border-magnum-300 break-keep disabled:opacity-25 font-medium leading-none text-magnum-300 bg-zinc-800 shadow hover:opacity-60 `}
      on:click={handleClickPetname}
    >
      📛
    </button>
    <button
      disabled={$nowProgress}
      class={`rounded-full h-[32px] border border-magnum-300 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-300 bg-zinc-800 shadow hover:opacity-60 `}
      on:click={handleClickFollow}
    >
      {$_("user.following")}
    </button>
  {:else}
    <button
      disabled={$nowProgress}
      class={`rounded-full bg-white border border-magnum-700 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-700 shadow hover:opacity-60 h-[32px] `}
      on:click={handleClickFollow}
    >
      {$_("user.follow")}
    </button>
  {/if}
{/if}

<AlertDialog
  bind:open={dialogOpen}
  {onClickOK}
  title={$_("user.followList.update")}
>
  <div slot="main">
    <div class="text-magnum-500 font-bold text-lg mt-2">Before</div>
    {#if $beforeKind3}
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
      >
        <ul class="leading-4">
          <li>
            Updated at <time
              class="font-semibold text-magnum-300"
              datetime={datetime($beforeKind3?.created_at)}
              >{formatAbsoluteDate($beforeKind3?.created_at, true)}</time
            ><span class="ml-2"
              >({formatRelativeDate($beforeKind3?.created_at, $locale)})</span
            >
          </li>
          <li>
            List length <span class="font-semibold text-zinc-200"
              >{$beforeKind3?.tags.length}</span
            >
          </li>
          <li>
            Followee <span class="font-semibold text-zinc-200"
              >{pubkeysIn($beforeKind3).size}</span
            >
          </li>
        </ul>
      </div>
    {/if}
    {#if $afterEventParameters}
      <ArrowBigDown />
      <div class="text-magnum-500 font-bold text-lg mt-2">After</div>
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
      >
        <ul class="leading-4">
          <li>
            List length <span class="font-semibold text-magnum-300"
              >{$afterEventParameters?.tags?.length}</span
            >
          </li>
          <li>
            Followee <span class="font-semibold text-magnum-300"
              >{$afterEventParameters?.tags?.reduce((acc, [tag, value]) => {
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
</AlertDialog>

<AlertDialog
  bind:open={openPetnameDialog}
  onClickOK={onClickOKPetname}
  title={$_("user.petname.write")}
  okButtonName="OK"
>
  <div slot="main">
    {#if $beforeKind3}
      <div class="flex flex-col items-start justify-center">
        <div class="font-medium text-magnum-400">Petname</div>
        <input
          type="text"
          class="h-10 w-full rounded-md px-3 py-2 mt-2 border border-magnum-600 bg-neutral-900"
          bind:value={petnameInput}
        />
      </div>
      <div class="text-sm mt-6 bg-neutral-700 rounded-sm p-2">
        Follow List Updated at<time
          class="font-semibold text-magnum-300 ml-2"
          datetime={datetime($beforeKind3?.created_at)}
          >{formatAbsoluteDate($beforeKind3?.created_at, true)}</time
        >
        ({formatRelativeDate($beforeKind3?.created_at, $locale)})
      </div>
    {/if}
  </div>
</AlertDialog>
