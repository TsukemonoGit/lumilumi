<script lang="ts">
  import Metadata from "../NostrMainData/Metadata.svelte";
  import { profile, splitHexColorString } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import { loginUser, showImg, showUserStatus } from "$lib/stores/stores";
  import { _ } from "svelte-i18n";

  import Nip05Check from "../NostrMainData/Nip05Check.svelte";
  import Link from "./Link.svelte";
  import FollowButton from "../NostrElements/Note/FollowButton.svelte";
  import Content from "../NostrElements/Note/Content.svelte";
  import UserAvatar from "./UserAvatar.svelte";
  import Avatar from "svelte-boring-avatars";
  import UserZap from "./UserZap.svelte";
  import ProfileEditButton from "./ProfileEditButton.svelte";

  import UserPofileEllipsis from "./UserPofileEllipsis.svelte";
  import { ExternalLink, Pin } from "lucide-svelte";
  import ShowStatus from "../NostrElements/Note/ShowStatus.svelte";
  import EllipsisMenuNote from "../NostrElements/Note/NoteActionButtuns/EllipsisMenuNote.svelte";
  import ReplyToUserButton from "./ReplyToUserButton.svelte";

  export let pubkey: string;
  export let bannerHeight: number = 180;
  export let iconSize: number = 80;
  export let depth: number;
  export let tieKey: string | undefined;
</script>

<Metadata queryKey={["metadata", pubkey]} {pubkey} let:metadata>
  <div
    slot="loading"
    class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
  >
    {nip19.npubEncode(pubkey)}<EllipsisMenuNote
      notestr={nip19.npubEncode(pubkey)}
    />
  </div>
  <div
    slot="nodata"
    class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
  >
    {nip19.npubEncode(pubkey)}<EllipsisMenuNote
      notestr={nip19.npubEncode(pubkey)}
    />
  </div>
  <div
    slot="error"
    class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
    let:error
  >
    {nip19.npubEncode(pubkey)}<EllipsisMenuNote
      notestr={nip19.npubEncode(pubkey)}
    />
  </div>
  {@const prof = profile(metadata)}

  {#if prof}
    <div class="flex flex-col">
      <div class="relative w-full">
        <div
          class="absolute bottom-0 left-1 flex flex-col h-fit justify-center items-center gap-2"
        >
          <div class="border border-magnum-400 rounded-full">
            {#if $showImg && prof.picture && prof.picture !== ""}
              <UserAvatar
                url={prof.picture}
                name={pubkey}
                {pubkey}
                size={iconSize}
              />
            {:else}
              <Avatar
                size={iconSize}
                name={pubkey}
                variant="beam"
                colors={splitHexColorString(pubkey)}
              />
            {/if}
          </div>
        </div>
        <div class="absolute bottom-1 right-2 flex flex-col gap-1">
          {#if $loginUser === pubkey}<a
              class="rounded-full p-1 bg-white border border-magnum-700 break-keep disabled:opacity-25 font-medium leading-none text-magnum-700 shadow hover:opacity-75 flex items-center active:opacity-50 justify-center gap-1"
              target="_blank"
              title={`Nostviewstr ${$_("settings.nostviewstr.kind10001")}`}
              rel="noopener noreferrer"
              href="https://nostviewstr.vercel.app/{nip19.npubEncode(
                $loginUser
              )}/10001"
              ><Pin class="w-5 rotate-45 " />{$_(
                "settings.nostviewstr.kind10001"
              )}<ExternalLink class="w-4 " />
            </a><ProfileEditButton {metadata} />{:else}<FollowButton
              {pubkey}
            />{/if}
        </div>
        <div
          class="bg-magnum-800 w-full border-b border-magnum-400"
          style="height:{bannerHeight}px"
        >
          {#if $showImg && prof.banner}
            <img
              src={prof.banner}
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
            {prof.display_name ?? ""}@{prof.name}
          </div>
          <div class="flex ml-auto gap-2">
            <ReplyToUserButton {metadata} />
            {#if prof.lud16 || prof.lud06}
              <div class=" w-fit"><UserZap {metadata} /></div>
            {/if}<UserPofileEllipsis {metadata} {prof} {tieKey} />
          </div>
        </div>
        {#if prof.nip05}
          <div class="text-sm flex break-all">
            {prof.nip05}<Nip05Check {pubkey} nip05Address={prof.nip05} />
          </div>{/if}
        {#if prof.website}<Link
            className="text-sm underline text-magnum-300 break-all  "
            href={prof.website}>{prof.website}</Link
          >{/if}

        {#if $showUserStatus}<ShowStatus {pubkey} {tieKey} />{/if}
      </div>

      {#if prof.about}
        <div
          class="whitespace-pre-wrap break-words overflow-y-auto mt-2 rounded-sm"
          style="word-break: break-word; max-height:{bannerHeight * 1.5}px"
        >
          <Content
            text={prof.about}
            tags={metadata.tags}
            displayMenu={true}
            {depth}
            repostable={false}
            {tieKey}
          />
        </div>
      {/if}
      <div class="flex flex-row-reverse gap-1">
        <!-- <button
          class="w-fit rounded-full bg-neutral-200 text-magnum-800 p-1 hover:opacity-75 active:opacity-50"
          ><FileJson2 /></button
        > -->
        <!-- <button
          class="w-fit rounded-full bg-neutral-200 text-magnum-800 p-1 hover:opacity-75 active:opacity-50"
          ><RadioTower /></button
        > -->
        <!-- <button
          on:click={handleClickReactions}
          class="w-fit rounded-full bg-neutral-200 text-magnum-800 p-1 hover:opacity-75 active:opacity-50"
          ><BookHeart /></button
        > -->
        <!-- <button
          class="w-fit rounded-full bg-neutral-200 text-magnum-800 p-1 hover:opacity-75 active:opacity-50"
          ><Pin /></button
        > -->
        <!-- <button
          class="w-fit rounded-full bg-neutral-200 text-magnum-800 p-1 hover:opacity-75 active:opacity-50"
          ><RefreshCcw /></button
        ><button
          class="w-fit rounded-full bg-neutral-200 text-magnum-800 p-1 hover:opacity-75 active:opacity-50"
          ><Copy /></button
        ><button
          class="w-fit rounded-full bg-neutral-200 text-magnum-800 p-1 hover:opacity-75 active:opacity-50"
          ><ExternalLink /></button
        > -->
      </div>
    </div>
  {/if}
</Metadata>
