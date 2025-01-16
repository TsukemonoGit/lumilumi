<script lang="ts">
  import { goto } from "$app/navigation";
  import { promisePublishEvent, usePromiseReq } from "$lib/func/nostr";
  import {
    emojis,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import type { Profile } from "$lib/types";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { onMount } from "svelte";
  import { pipe } from "rxjs";
  import { latest, uniq, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  //import { samplemetadata, sample2 } from "./data";
  import { _ } from "svelte-i18n";

  import Link from "$lib/components/Elements/Link.svelte";
  import Content from "$lib/components/NostrElements/content/Content.svelte";
  import { generateResultMessage } from "$lib/func/util";

  import { nip19 } from "nostr-tools";
  import { SmilePlus } from "lucide-svelte";
  import Popover from "$lib/components/Elements/Popover.svelte";

  import InputImageFromFile from "./InputImageFromFile.svelte";
  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import { LUD06Regex, LUD16Regex } from "$lib/func/regex";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    data: {
      pubkey: string;
    };
  }

  let { data }: Props = $props();
  // const data={pubkey:$page.params.npub};
  console.log(data.pubkey);
  const bannerHeight = 120;
  const iconSize = 40;
  let profile: Profile;
  let metadata: Nostr.Event;
  const key: QueryKey = ["metadata", data.pubkey];
  const filters = [{ kinds: [0], authors: [data.pubkey], limit: 1 }];
  const operator = pipe(latest(), uniq());

  let newProfile: Profile | undefined = $state();
  let lud: string = $state("");
  let newTags: string[][] = $state.raw([]);
  let isError = $state(false);
  onMount(async () => {
    if (!queryClient) {
      console.log("error");
      return;
    }
    try {
      const signPubkey = await (
        window.nostr as Nostr.Nip07.Nostr
      )?.getPublicKey();
      if (data.pubkey !== signPubkey) {
        $toastSettings = {
          title: "Error",
          description: "login pubkey ≠ sign pubkey",
          color: "bg-red-500",
        };
        isError = true;
        return;
      }
    } catch (error) {
      $toastSettings = {
        title: "Error",
        description: "failed to get sign pubkey",
        color: "bg-red-500",
      };
      isError = true;
      return;
    }
    $nowProgress = true;
    const queryData: EventPacket | undefined = queryClient.getQueryData(key);
    if (queryData) {
      metadata = queryData.event;
    } else {
      //プロフィールを更新ボタンはあるんだし改めて最新を取得する必要なし
      const ev = await usePromiseReq({ filters, operator }, undefined);
      console.log(ev);
      if (ev && ev.length > 0) {
        // if (queryData && queryData.event.created_at > ev[0].event.created_at) {
        //   metadata = queryData.event;
        // } else {
        metadata = ev[0].event;
        //}
      }
    }
    //metadata = sample2;
    if (!metadata) {
       console.error("failed to get metadata event");
      $nowProgress = false;
      metadata = {pubkey:data.pubkey,content:"{}",tags:[]};
      // console.error("failed to get metadata event");
      // $nowProgress = false;

      // $toastSettings = {
      //   title: "Warning",
      //   description: `failed to get metadata event`,
      //   color: "bg-orange-500",
      // };
      // setTimeout(() => {
      //   goto(`/${nip19.npubEncode(data.pubkey)}`);
      // });
      // return;
    }
    newTags = metadata.tags;
    try {
      profile = JSON.parse(metadata.content);
      newProfile = { ...profile };
      let { lud06, lud16 } = profile;
      if (lud16) {
        lud = lud16;
      } else if (lud06) {
        lud = lud06;
      }
    } catch (error) {
      console.error("failed to parse metadata");
    }
    $nowProgress = false;
  });

  // afterNavigate((navigate) => {
  //   console.log("afterNavigate", navigate.type);
  // });

  const handleClickSave = async () => {
    if (lud !== "") {
      if (newProfile && LUD06Regex.test(lud.trim())) {
        newProfile.lud06 = lud;
      } else if (newProfile && LUD16Regex.test(lud.trim())) {
        newProfile.lud16 = lud;
      } else {
        //ludに何かしら入力があるのに06でも16でもないとき
        $toastSettings = {
          title: "Warning",
          description: `Error ${$_("profile.lud")}`,
          color: "bg-orange-500",
        };
        return;
      }
    }
    $nowProgress = true;
    // newProfileに含まれていない絵文字タグを削除する
    newTags = newTags.filter((tag) => {
      if (tag[0] === "emoji") {
        const emojiText = `:${tag[1]}:`;
        return (
          newProfile?.about?.includes(emojiText) ||
          newProfile?.display_name?.includes(emojiText)
        );
      }
      return true;
    });

    try {
      const content = JSON.stringify(newProfile);
      if (content === "") {
        throw Error;
      }
      const ev: Nostr.EventParameters = {
        kind: 0,
        content: content,
        tags: newTags,
        pubkey: data.pubkey,
      };
      const { event, res } = await promisePublishEvent(ev);
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
        queryClient.refetchQueries({
          queryKey: key,
        });
      }
      $nowProgress = false;
    } catch (error) {
      $toastSettings = {
        title: "Warning",
        description: `Error  `,
        color: "bg-orange-500",
      };
      $nowProgress = false;
      return;
    }
  };

  let cursorPosition: number = 0;
  let customReaction: string = "";

  const handleTextareaInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    cursorPosition = target.selectionStart;
  };

  const handleClickEmoji = (e: string[]) => {
    if (!newProfile) return;
    const emojiTag = ["emoji", ...e];
    if (!newTags.some((tag) => tag[0] === "emoji" && tag[1] === e[0])) {
      newTags.push(emojiTag);
    }
    const emojiText = `:${e[0]}:`;

    newProfile.about =
      newProfile.about?.slice(0, cursorPosition) +
      emojiText +
      newProfile.about?.slice(cursorPosition);
    cursorPosition += emojiText.length;
  };
  const handleClickEmojiDisplayName = (e: string[]) => {
    if (!newProfile) return;
    const emojiTag = ["emoji", ...e];
    if (!newTags.some((tag) => tag[0] === "emoji" && tag[1] === e[0])) {
      newTags.push(emojiTag);
    }
    const emojiText = `:${e[0]}:`;
    newProfile.display_name = newProfile.display_name + emojiText;
    // newProfile.display_name?.slice(0, cursorPosition) +
    // emojiText +
    // newProfile.display_name?.slice(cursorPosition);
    // cursorPosition += emojiText.length;
  };
</script>

<section class=" w-full">
  {#if isError}
    error
  {:else if newProfile}
    <div
      class="flex flex-col w-full border border-magnum-500 rounded-md overflow-hidden"
    >
      <div class="relative w-full">
        <div class="absolute top-0 font-bold text-magnum-400 left-1">
          Preview
        </div>
        <div
          class="absolute bottom-0 left-1 flex flex-col h-fit justify-center items-center gap-2"
        >
          <div class="border border-magnum-400 rounded-full">
            <!--プロフィール編集のときは画像表示モードじゃなくてもプレビューだそう-->
            {#if newProfile.picture && newProfile.picture !== ""}
              <div
                class="flex items-center justify-center rounded-full bg-neutral-800 overflow-hidden"
                style="height: {iconSize}px; width: {iconSize}px;"
              >
                <img
                  loading="lazy"
                  alt="Avatar"
                  class="relative object-cover rounded-full"
                  style="height: 100%; width: 100%; object-fit: cover; object-position: center;"
                  src={newProfile.picture}
                />
              </div>
            {/if}
          </div>
        </div>

        <div
          class="bg-magnum-800 w-full border-b border-magnum-400"
          style="height:{bannerHeight}px"
        >
          {#if newProfile.banner}
            <img
              src={newProfile.banner}
              alt="banner"
              class="object-cover mx-auto"
              style="height: 100%;  object-fit: cover; object-position: center;"
              loading="lazy"
            />
          {/if}
        </div>
      </div>

      <div class=" flex flex-col justify-center mt-auto">
        <div class="flex flex-row items-center gap-2 mt-1">
          <div class=" sm:text-xl text-md font-bold break-all text-left">
            {#if newProfile.display_name}
              <DisplayName
                height={21}
                name={newProfile.display_name}
                tags={newTags}
              />
            {/if}{#if newProfile.name && newProfile.name !== ""}<DisplayName
                height={21}
                name={`@${newProfile.name}`}
                tags={newTags}
              />{/if}
          </div>
          {#if newProfile.bot}<span class="text-sm font-normal">bot</span>{/if}
        </div>
        {#if newProfile.nip05}
          <div class="text-sm flex break-all">
            {newProfile.nip05}
          </div>{/if}
        {#if newProfile.website}<Link
            className="text-sm underline text-magnum-300 break-all  "
            href={newProfile.website}
            >{#snippet content()}{newProfile?.website}{/snippet}</Link
          >{/if}
      </div>

      {#if newProfile.about}
        <Content
          maxHeight={bannerHeight}
          text={newProfile.about}
          tags={newTags}
          displayMenu={true}
          depth={0}
          repostable={true}
          tieKey={undefined}
        />
      {/if}
    </div>

    <!--ここから-->
    <div class="flex flex-col w-full mt-4">
      <div class="font-bold text-magnum-500">{$_("user.profileEdit")}</div>
      {$_("profile.name")}

      @<input
        type="text"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
        bind:value={newProfile.name}
        placeholder="name"
      />

      {$_("profile.display_name")}
      <input
        type="text"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
        bind:value={newProfile.display_name}
        placeholder="display_name"
      />{#if $emojis && $emojis.list.length > 0}
        <div class="w-fit flex self-end">
          <Popover ariaLabel="custom emoji">
            <SmilePlus size="20" />
            {#snippet popoverContent()}
              <div>
                <div
                  class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto"
                >
                  {#each $emojis.list as e, index}
                    {#if customReaction === "" || e[0]
                        .toLowerCase()
                        .includes(customReaction.toLowerCase())}
                      <button
                        onclick={() => handleClickEmojiDisplayName(e)}
                        class="rounded-md border m-0.5 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
                      >
                        {#if lumiSetting.get().showImg}
                          <img
                            loading="lazy"
                            class="h-6 object-contain justify-self-center"
                            src={e[1]}
                            alt={e[0]}
                            title={e[0]}
                          />{:else}{e[0]}{/if}
                      </button>
                    {/if}
                  {/each}
                </div>
              </div>
            {/snippet}
          </Popover>
        </div>
      {/if}
      <div class="flex gap-2 mb-2 items-end justify-between">
        {$_("profile.picture")}<InputImageFromFile
          bind:inputText={newProfile.picture}
        />
      </div>
      <input
        type="text"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
        bind:value={newProfile.picture}
        placeholder="https://example.com/picture.webp"
      />
      <!-- <div class="flex justify-center flex-col items-center text-magnum-400">
        preview
        <div
          class="h-24 min-w-24 w-fit max-w-full rounded-md px-3 py-2 border border-magnum-500"
        >
          <img
            loading="lazy"
            class="h-full object-contain justify-self-center"
            src={newProfile.picture}
            alt={""}
          />
        </div>
      </div> -->
      <div class="flex gap-2 mb-2 items-end justify-between">
        {$_("profile.banner")}
        <InputImageFromFile bind:inputText={newProfile.banner} />
      </div>
      <input
        type="text"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
        bind:value={newProfile.banner}
        placeholder="https://example.com/banner.webp"
      />
      <!-- <div class="flex justify-center flex-col items-center text-magnum-400">
        preview
        <div
          class="h-24 w-fit min-w-24 max-w-full rounded-md px-3 py-2 border border-magnum-500"
        >
          <img
            loading="lazy"
            class="h-full object-contain justify-self-center"
            src={newProfile.banner}
            alt={""}
          />
        </div>
      </div> -->
      {$_("profile.about")}
      <textarea
        class="h-32 w-full rounded-md border border-magnum-500 p-2 leading-none bg-neutral-800 mb-2"
        bind:value={newProfile.about}
        oninput={handleTextareaInput}
        onclick={handleTextareaInput}
      ></textarea>
      {#if $emojis && $emojis.list.length > 0}
        <div class="w-fit flex self-end">
          <Popover ariaLabel="custom emoji">
            <SmilePlus size="20" />
            {#snippet popoverContent()}
              <div>
                <div
                  class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto"
                >
                  {#each $emojis.list as e, index}
                    {#if customReaction === "" || e[0]
                        .toLowerCase()
                        .includes(customReaction.toLowerCase())}
                      <button
                        onclick={() => handleClickEmoji(e)}
                        class="rounded-md border m-0.5 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
                      >
                        {#if lumiSetting.get().showImg}
                          <img
                            loading="lazy"
                            class="h-6 object-contain justify-self-center"
                            src={e[1]}
                            alt={e[0]}
                            title={e[0]}
                          />{:else}{e[0]}{/if}
                      </button>
                    {/if}
                  {/each}
                </div>
              </div>
            {/snippet}
          </Popover>
        </div>
      {/if}
      {$_("profile.nip05")}
      <input
        type="text"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
        bind:value={newProfile.nip05}
        placeholder="name@domain.example.com"
      />
      {$_("profile.website")}
      <input
        type="text"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
        bind:value={newProfile.website}
        placeholder="https://example.com"
      />

      {$_("profile.lud")}
      <input
        type="text"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
        bind:value={lud}
        placeholder="LURL1XXXXXX / example@wallet.example.com"
      />
    </div>

    <button
      onclick={handleClickSave}
      class="my-4 items-center justify-center rounded-sm
  bg-magnum-50 px-8 py-3 font-medium leading-none text-magnum-900 hover:opacity-75 active:opacity-50"
      >SAVE</button
    >
  {/if}
</section>
