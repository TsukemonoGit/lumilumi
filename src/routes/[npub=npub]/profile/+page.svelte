<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { promisePublishEvent, usePromiseReq } from "$lib/func/nostr";
  import {
    loginUser,
    nowProgress,
    queryClient,
    showImg,
    toastSettings,
  } from "$lib/stores/stores";
  import type { Profile } from "$lib/types";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { onMount } from "svelte";
  import { pipe } from "rxjs";
  import { latest, uniq, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import { samplemetadata, sample2 } from "./data";
  import { _ } from "svelte-i18n";
  import UserProfile from "$lib/components/Elements/UserProfile.svelte";
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import Avatar from "svelte-boring-avatars";
  import Link from "$lib/components/Elements/Link.svelte";
  import Content from "$lib/components/NostrElements/Note/Content.svelte";
  import {
    generateResultMessage,
    LUD06Regex,
    LUD16Regex,
    splitHexColorString,
  } from "$lib/func/util";
  import { page } from "$app/stores";
  import type { EventTemplate } from "nostr-tools";

  export let data: {
    pubkey: string;
  };
  // const data={pubkey:$page.params.npub};
  console.log(data.pubkey);
  const bannerHeight = 80;
  const iconSize = 40;
  let profile: Profile;
  let metadata: Nostr.Event;
  const key: QueryKey = ["metadata", data.pubkey];
  const filters = [{ kinds: [0], authors: [data.pubkey], limit: 1 }];
  const operator = pipe(latest(), uniq());

  let newProfile: Profile;
  let lud: string = "";

  onMount(async () => {
    $nowProgress = true;
    const data: EventPacket | undefined = $queryClient?.getQueryData(key);

    const ev = await usePromiseReq({ queryKey: key, filters, operator });
    console.log(ev);
    if (ev && ev.length > 0) {
      if (data && data.event.created_at > ev[0].event.created_at) {
        metadata = data.event;
      } else {
        metadata = ev[0].event;
      }
    }
    //metadata = sample2;
    if (!metadata) {
      console.error("failed to get metadata event");
      return;
    }
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

  afterNavigate(() => {
    console.log("afternavigate");
  });

  const handleClickSave = async () => {
    if (lud !== "") {
      if (LUD06Regex.test(lud.trim())) {
        newProfile.lud06 = lud;
      } else if (LUD16Regex.test(lud.trim())) {
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
    try {
      $nowProgress = true;
      const content = JSON.stringify(newProfile);
      if (content === "") {
        throw Error;
      }
      const ev: Nostr.EventParameters = {
        kind: 0,
        content: content,
        tags: [],
      };
      const { event, res } = await promisePublishEvent(ev);
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
</script>

<section class="container w-full">
  {#if newProfile}
    <div
      class="flex flex-col w-full border border-magnum-500 rounded-md overflow-hidden"
    >
      <div class="relative w-full">
        <div
          class="absolute bottom-0 left-1 flex flex-col h-fit justify-center items-center gap-2"
        >
          <div class="border border-magnum-400 rounded-full">
            {#if $showImg && newProfile.picture && newProfile.picture !== ""}
              <UserAvatar
                url={newProfile.picture}
                name={newProfile.name ?? ""}
                pubkey={data.pubkey}
                size={iconSize}
              />
            {:else}
              <Avatar
                size={iconSize}
                name={data.pubkey}
                variant="beam"
                colors={splitHexColorString(data.pubkey)}
              />
            {/if}
          </div>
        </div>

        <div
          class="bg-magnum-800 w-full border-b border-magnum-400"
          style="height:{bannerHeight}px"
        >
          {#if $showImg && newProfile.banner}
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
          <div class="sm:text-xl text-md font-bold break-all">
            {newProfile.display_name ?? ""}@{newProfile.name}
          </div>
        </div>
        {#if newProfile.nip05}
          <div class="text-sm flex break-all">
            {newProfile.nip05}
          </div>{/if}
        {#if newProfile.website}<Link
            className="text-sm underline text-magnum-300 break-all  "
            href={newProfile.website}>{newProfile.website}</Link
          >{/if}
      </div>

      {#if newProfile.about}
        <div
          class="whitespace-pre-wrap break-words overflow-y-auto mt-2 rounded-sm"
          style="word-break: break-word; max-height:{bannerHeight * 1.5}px"
        >
          <!-- <Content text={newProfile.about} tags={metadata.tags} /> -->
        </div>
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
      />

      {$_("profile.picture")}
      <input
        type="text"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
        bind:value={newProfile.picture}
        placeholder="https://example.com/picture.webp"
      />
      <div class="flex justify-center flex-col items-center text-magnum-400">
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
      </div>
      {$_("profile.banner")}
      <input
        type="text"
        class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
        bind:value={newProfile.banner}
        placeholder="https://example.com/banner.webp"
      />
      <div class="flex justify-center flex-col items-center text-magnum-400">
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
      </div>
      {$_("profile.about")}
      <textarea
        class="h-32 w-full rounded-md border border-magnum-500 p-2 leading-none bg-neutral-800 mb-2"
        bind:value={newProfile.about}
      />

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
      on:click={handleClickSave}
      class="my-4 items-center justify-center rounded-sm
  bg-magnum-50 px-8 py-3 font-medium leading-none text-magnum-900 hover:opacity-75 active:opacity-50"
      >SAVE</button
    >
  {/if}
</section>
