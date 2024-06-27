<script lang="ts">
  import Metadata from "./Metadata.svelte";
  import { profile, splitHexColorString } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import { loginUser, showImg } from "$lib/stores/stores";
  import UserAvatar from "../Elements/UserAvatar.svelte";
  import Avatar from "svelte-boring-avatars";
  import Content from "../Note/Content.svelte";
  import { _ } from "svelte-i18n";
  import { getFollowingList, usePromiseReq, pubkeysIn } from "$lib/func/nostr";
  import { queryClient } from "$lib/stores/stores";
  import {
    type EventPacket,
    createRxBackwardReq,
    uniq,
    verify,
  } from "rx-nostr";
  import { pipe } from "rxjs";

  import * as Nostr from "nostr-typedef";
  import { scanArray } from "$lib/stores/operators";
  import { beforeNavigate } from "$app/navigation";
  import { isfolloweeFunc } from "$lib/func/dataUpdate";

  export let pubkey: string;
  $: isfollowee = isfolloweeFunc(pubkey);

  const handleClickFollow = async () => {
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

  beforeNavigate(() => {});
</script>

<Metadata queryKey={["metadata", pubkey]} {pubkey} let:metadata>
  <div slot="loading" class="text-sm text-neutral-500 flex-inline break-all">
    {nip19.npubEncode(pubkey)}
  </div>
  <div slot="nodata" class="text-sm text-neutral-500 flex-inline break-all">
    {nip19.npubEncode(pubkey)}
  </div>
  <div
    slot="error"
    class="text-sm text-neutral-500 flex-inline break-all"
    let:error
  >
    {nip19.npubEncode(pubkey)}
  </div>
  {#await profile(metadata) then profile}
    {#if profile}
      <div class="relative w-full">
        <div class="bg-magnum-800 w-full h-56 border-b border-magnum-400">
          {#if $showImg && profile.banner}
            <img
              src={profile.banner}
              alt="banner"
              class="object-cover mx-auto"
              style="height: 100%;  object-fit: cover; object-position: center;"
              loading="lazy"
            />
          {/if}
        </div>

        <div
          class="grid grid-cols-[auto_1fr] w-full align-items-end mt-[-42px] px-0 sm:px-4"
        >
          <div
            class="relative z-10 border border-magnum-400 rounded-full h-fit"
          >
            {#if $showImg && profile.picture}
              <UserAvatar
                url={profile.picture}
                name={profile.name}
                {pubkey}
                size={120}
              />
            {:else}
              <Avatar
                size={120}
                name={pubkey}
                variant="beam"
                colors={splitHexColorString(pubkey)}
              />
            {/if}
          </div>
          <div class="flex flex-row flex-wrap">
            <div class="ml-3 flex flex-col justify-center mt-auto pb-2">
              <div class="sm:text-xl text-md font-bold">
                {profile.display_name ?? ""}@{profile.name}
              </div>
              <div class="text-sm text-neutral-500"></div>
              <div class="text-sm">{profile.nip05}</div>
              <div class="text-sm">{profile.website}</div>
            </div>
            {#if isfollowee !== undefined}
              <div class="flex ml-auto items-end">
                <button
                  class=" rounded-full bg-white border border-magnum-700 p-3 break-keep
              font-medium leading-none text-magnum-700 shadow hover:opacity-75 {isfollowee
                    ? 'opacity-75'
                    : ''}"
                  on:click={handleClickFollow}
                  >{isfollowee
                    ? `${$_("user.following")}`
                    : `${$_("user.follow")}`}</button
                >
              </div>
            {/if}
          </div>
        </div>

        {#if profile.about}
          <div
            class="whitespace-pre-wrap break-words max-h-72 overflow-y-auto mx-4 p-2 rounded-sm"
            style="word-break: break-word;"
          >
            <Content text={profile.about} tags={metadata.tags} />
          </div>
        {/if}
      </div>
    {/if}
  {/await}
</Metadata>
