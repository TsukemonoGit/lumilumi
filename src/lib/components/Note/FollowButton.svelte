<script lang="ts">
  import { isfolloweeFunc } from "$lib/func/dataUpdate";
  import { usePromiseReq, pubkeysIn } from "$lib/func/nostr";
  import { scanArray } from "$lib/stores/operators";
  import { loginUser, queryClient } from "$lib/stores/stores";
  import {
    type EventPacket,
    createRxBackwardReq,
    uniq,
    verify,
  } from "rx-nostr";
  import { _ } from "svelte-i18n";
  import { pipe } from "rxjs";

  import * as Nostr from "nostr-typedef";

  export let pubkey: string;

  $: isfollowee = isfolloweeFunc(pubkey);

  const handleClickFollow = async () => {
    console.log("mada");
    if ($loginUser === "") {
      return;
    }
    let kind3Event: EventPacket | undefined = $queryClient.getQueryData([
      "timeline",
      "contacts",
      $loginUser,
    ]);
    console.log(kind3Event);
    if (!kind3Event) {
      return;
    }
    //更新されてるかもしれないからデータ取り直してみる
    // $queryClient.invalidateQueries({
    //   queryKey: ["timeline", "contacts", $loginUser],
    // });
    // //いつこうしんおわる？
    // const newKind3Event = $queryClient.getQueryData([
    //   "timeline",
    //   "contacts",
    //   $loginUser,
    // ]);
    const newReq = createRxBackwardReq();
    const operator = pipe(uniq(), verify(), scanArray()); //scanArrayはとりあえずusePromiseReqがそうしてるから
    const filters = [{ kinds: [3], authors: [$loginUser], limit: 1 }];
    const newkind3: EventPacket[] = await usePromiseReq({
      operator: operator,
      queryKey: ["timeline", "contacts", $loginUser],
      filters: filters,
      req: newReq,
    });
    if (newkind3.length > 0) {
      console.log(newkind3[0]);
      if (newkind3[0].event.created_at > kind3Event.event.created_at) {
        kind3Event = newkind3[0];
        pubkeysIn(kind3Event.event); //pubkeyリストを更新する
        //新しく取ったヤツのほうが新しかったら色々更新する
      }
    }
    isfollowee = isfolloweeFunc(pubkey);
    console.log(kind3Event);
    if (isfollowee) {
      //フォロー外していいかの確認画面的なの
      console.log(isfollowee);
    } else {
      //フォローする

      console.log(isfollowee);
    }
  };
</script>

{#if isfollowee !== undefined}
  <div class="flex ml-auto items-end">
    <button
      class=" rounded-full bg-white border border-magnum-700 p-3 break-keep
font-medium leading-none text-magnum-700 shadow hover:opacity-75 {isfollowee
        ? 'opacity-75'
        : ''}"
      on:click={handleClickFollow}
      >{isfollowee ? `${$_("user.following")}` : `${$_("user.follow")}`}</button
    >
  </div>
{/if}
