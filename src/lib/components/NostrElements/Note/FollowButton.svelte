<script lang="ts">
  import { isfolloweeFunc } from "$lib/func/dataUpdate";
  import {
    usePromiseReq,
    pubkeysIn,
    promisePublishEvent,
  } from "$lib/func/nostr";
  import {
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { type EventPacket, createRxBackwardReq, latest } from "rx-nostr";
  import { _ } from "svelte-i18n";
  import { pipe } from "rxjs";

  import * as Nostr from "nostr-typedef";
  import { writable } from "svelte/store";
  import {
    datetime,
    formatAbsoluteDate,
    generateResultMessage,
  } from "$lib/func/util";
  import { ArrowBigDown } from "lucide-svelte";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";

  export let pubkey: string;

  const beforeKind3 = writable<Nostr.Event | undefined>();
  const afterEventParameters = writable<Nostr.EventParameters | undefined>();
  let dialogOpen: any;

  $: isfollowee = isfolloweeFunc(pubkey);

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
    const followState = isfolloweeFunc(pubkey);
    let kind3Event: EventPacket | undefined = $queryClient.getQueryData([
      "timeline",
      "contacts",
      $loginUser,
    ]);
    console.log(kind3Event);

    if (!kind3Event) return;

    $nowProgress = true;
    const newkind3 = await updateKind3();

    if (newkind3.length > 0) {
      newkind3.sort((a, b) => b.event.created_at - a.event.created_at);
      console.log(newkind3);

      if (newkind3[0].event.created_at > kind3Event.event.created_at) {
        kind3Event = newkind3[0];
        pubkeysIn(kind3Event.event); // pubkeyリストを更新する
      }
    }

    $beforeKind3 = kind3Event.event;
    const newKind3Event = $queryClient.getQueryData([
      "timeline",
      "contacts",
      $loginUser,
    ]);
    console.log(newKind3Event);

    isfollowee = isfolloweeFunc(pubkey);
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

    const isSuccess = res.filter((item) => item.ok);
    const isFailed = res.filter((item) => !item.ok);

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

    isfollowee = isfolloweeFunc(pubkey);
    resetState();
  };

  const resetState = () => {
    $beforeKind3 = undefined;
    $afterEventParameters = undefined;
    $nowProgress = false;
  };

  async function updateKind3(): Promise<EventPacket[]> {
    const newReq = createRxBackwardReq();
    const operator = pipe(latest());
    const filters = [{ kinds: [3], authors: [$loginUser], limit: 1 }];

    const newkind3: EventPacket[] = await usePromiseReq(
      {
        operator,
        queryKey: ["timeline", "contacts", $loginUser],
        filters,
        req: newReq,
      },
      undefined
    );
    console.log("length", newkind3.length);
    console.log("list", newkind3);
    return newkind3;
  }
</script>

{#if isfollowee !== undefined}
  <button
    disabled={$nowProgress}
    class="rounded-full bg-white border border-magnum-700 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-700 shadow hover:opacity-60 opacity-100 {isfollowee
      ? 'opacity-75'
      : ''}"
    on:click={handleClickFollow}
  >
    {isfollowee ? `${$_("user.following")}` : `${$_("user.follow")}`}
  </button>
{/if}

<AlertDialog bind:open={dialogOpen} {onClickOK} title="followList の 更新">
  <div slot="main">
    <div class="text-magnum-500 font-bold text-lg mt-2">Before</div>
    {#if $beforeKind3}
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
      >
        <ul class="leading-4">
          <li>
            Created at <time
              class="font-semibold text-magnum-300"
              datetime={datetime($beforeKind3?.created_at)}
              >{formatAbsoluteDate($beforeKind3?.created_at, true)}</time
            >
          </li>
          <li>
            List length <span class="font-semibold text-zinc-200"
              >{$beforeKind3?.tags.length}</span
            >
          </li>
          <li>
            Followee <span class="font-semibold text-zinc-200"
              >{pubkeysIn($beforeKind3).length}</span
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
