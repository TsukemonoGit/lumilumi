<script lang="ts">
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import { encodetoNpub } from "$lib/func/encode";
  import { hexRegex } from "$lib/func/regex";
  import { profile, splitHexColorString } from "$lib/func/util";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "./UserAvatar.svelte";

  import Nip05Check from "./Nip05Check.svelte";
  import { loginUser } from "$lib/stores/stores";
  import MuteStatusIcons from "$lib/components/Elements/MuteStatusIcons.svelte";

  import UserZap from "./UserZap.svelte";
  import UserPofileEllipsis from "./UserPofileEllipsis.svelte";
  import UserEditEllipsis from "./UserEditEllipsis.svelte";
  import FollowButton from "./FollowButton.svelte";
  import Link from "$lib/components/Elements/Link.svelte";
  import ShowStatus from "../kindEvents/Status/ShowStatus.svelte";
  import Content from "../content/Content.svelte";
  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import ReplyToUserButton from "$lib/components/NostrElements/user/ReplyToUserButton.svelte";
  import { _ } from "svelte-i18n";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import { type Writable, writable } from "svelte/store";
  import type { Profile } from "$lib/types";
  import * as Nostr from "nostr-typedef";

  interface Props {
    // import * as Nostr from "nostr-typedef";
    pubkey: string;
    bannerHeight?: number;
    iconSize?: number;
    depth: number;
    tieKey: string | undefined;
    zIndex?: number | undefined;
  }

  let {
    pubkey,
    bannerHeight = 180,
    iconSize = 80,
    depth,
    tieKey,
    zIndex = 0,
  }: Props = $props();
  let petname = $derived(followList.get().get(pubkey));

  let pubcheck = $derived(hexRegex.test(pubkey));

  let loadingText = $derived(encodetoNpub(pubkey));

  // svelte-ignore non_reactive_update
  let dialogOpen: Writable<boolean> = writable(false);

  let prof: Profile | undefined = $state();

  const metadataChange = (metadata: Nostr.Event) => {
    prof = profile(metadata);
  };
</script>

{#if !pubcheck}
  invalid pubkey
{:else}
  <Metadata queryKey={["metadata", pubkey]} {pubkey} onChange={metadataChange}>
    {#snippet loading()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        {loadingText}
        <div class="flex flex-row ml-auto gap-2">
          {#if $loginUser !== pubkey}<MuteStatusIcons
              {pubkey}
            /><ReplyToUserButton {pubkey} />{/if}
          <UserPofileEllipsis {pubkey} {tieKey} />

          {#if $loginUser === pubkey}<UserEditEllipsis {pubkey} />{:else}
            <FollowButton {pubkey} />{/if}
        </div>
      </div>
    {/snippet}
    {#snippet nodata()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        {loadingText}
        <div class="flex flex-row ml-auto gap-2">
          {#if $loginUser !== pubkey}<MuteStatusIcons
              {pubkey}
            /><ReplyToUserButton {pubkey} />{/if}
          <UserPofileEllipsis {pubkey} {tieKey} />

          {#if $loginUser === pubkey}<UserEditEllipsis {pubkey} />{:else}
            <FollowButton {pubkey} />{/if}
        </div>
      </div>
    {/snippet}
    {#snippet error()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        {loadingText}
        <div class="flex flex-row ml-auto gap-2">
          {#if $loginUser !== pubkey}<MuteStatusIcons
              {pubkey}
            /><ReplyToUserButton {pubkey} />{/if}
          <UserPofileEllipsis {pubkey} {tieKey} />

          {#if $loginUser === pubkey}<UserEditEllipsis {pubkey} />{:else}
            <FollowButton {pubkey} />{/if}
        </div>
      </div>
    {/snippet}
    {#snippet content({ metadata })}
      {#if prof}
        <div class="flex flex-col">
          <div class="relative w-full">
            <div
              class="absolute bottom-0 left-1 flex flex-col h-fit justify-center items-center gap-2"
            >
              <div class=" border border-magnum-400 rounded-full">
                {#if lumiSetting.get().showImg && prof.picture && prof.picture !== ""}
                  <button class="flex" onclick={() => ($dialogOpen = true)}>
                    <UserAvatar
                      url={prof.picture}
                      name={pubkey}
                      {pubkey}
                      size={iconSize}
                    /></button
                  >
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
            <div
              class="bg-magnum-800 w-full border-b border-magnum-400"
              style="height:{bannerHeight}px"
            >
              {#if lumiSetting.get().showImg && prof.banner}
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
            <!--nameとか | アイコン-->
            <div class="flex flex-row items-center gap-2 mt-1 justify-between">
              <div class="flex flex-col gap-2 mt-1">
                <div class=" sm:text-xl text-md font-bold break-all text-left">
                  {#if prof.display_name}
                    <DisplayName
                      height={21}
                      name={prof.display_name}
                      tags={metadata.tags}
                    />
                  {/if}{#if prof.name && prof.name !== ""}<DisplayName
                      height={21}
                      name={`@${prof.name}`}
                      tags={metadata.tags}
                    />{/if}
                  {#if prof.bot}<span class="text-sm font-normal">bot</span
                    >{/if}
                  {#if petname}
                    <span class="align-middle">📛{petname}</span>{/if}
                </div>
                {#if prof.nip05}
                  <div class="text-sm flex break-all flex-wrap items-center">
                    {prof.nip05}<Nip05Check
                      {pubkey}
                      nip05Address={prof.nip05}
                    />
                  </div>{/if}
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex flex-row ml-auto gap-2">
                  {#if $loginUser !== pubkey}<MuteStatusIcons
                      {pubkey}
                    /><ReplyToUserButton {pubkey} />{/if}
                  {#if prof.lud16 || prof.lud06}
                    <div class=" w-fit"><UserZap {metadata} /></div>
                  {/if}<UserPofileEllipsis
                    {pubkey}
                    {metadata}
                    {prof}
                    {tieKey}
                  />
                </div>
                <div class="flex flex-row ml-auto gap-2">
                  {#if $loginUser === pubkey}<UserEditEllipsis
                      {pubkey}
                    />{:else}
                    <FollowButton {pubkey} />{/if}
                </div>
              </div>
            </div>

            {#if prof.website}<Link
                className="text-sm underline text-magnum-300 break-all  "
                href={prof.website}
                >{#snippet content()}
                  {prof?.website}{/snippet}</Link
              >{/if}

            {#if lumiSetting.get().showUserStatus}<ShowStatus
                {pubkey}
                {tieKey}
              />{/if}
          </div>

          {#if prof.about}
            <Content
              {zIndex}
              maxHeight={bannerHeight * 1.5}
              text={prof.about}
              tags={metadata.tags}
              displayMenu={true}
              {depth}
              repostable={false}
              {tieKey}
            />
          {/if}
        </div>
      {/if}
    {/snippet}
  </Metadata>
{/if}
<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen} zIndex={zIndex + 10}>
  {#snippet main()}
    <div class="w-full h-full overflow-hidden flex justify-center items-center">
      <img
        alt=""
        src={prof?.picture || ""}
        class="max-h-full max-full object-contain"
      />
    </div>
  {/snippet}
</Dialog>
