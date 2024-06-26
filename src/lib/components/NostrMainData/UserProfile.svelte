<script lang="ts">
  import Metadata from "./Metadata.svelte";
  import { profile, splitHexColorString } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import { showImg } from "$lib/stores/stores";
  import { _ } from "svelte-i18n";

  import { beforeNavigate } from "$app/navigation";
  import Nip05Check from "./Nip05Check.svelte";
  import Link from "../Elements/Link.svelte";
  import FollowButton from "../NostrElements/Note/FollowButton.svelte";
  import Content from "../NostrElements/Note/Content.svelte";
  import UserAvatar from "../Elements/UserAvatar.svelte";
  import Avatar from "svelte-boring-avatars";

  export let pubkey: string;
  export let bannerHeight: number = 224;
  export let iconSize: number = 120;
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
        <div
          class="bg-magnum-800 w-full border-b border-magnum-400"
          style="height:{bannerHeight}px"
        >
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
            class="relative z-10 border border-magnum-400 rounded-full flex h-fit"
          >
            {#if $showImg && profile.picture && profile.picture !== ""}
              <UserAvatar
                url={profile.picture}
                name={profile.name ?? ""}
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
          <div class="flex flex-row flex-wrap">
            <div class="ml-3 flex flex-col justify-center mt-auto pb-2">
              <div class="sm:text-xl text-md font-bold">
                {profile.display_name ?? ""}@{profile.name}
              </div>
              <div class="text-sm text-neutral-500"></div>
              {#if profile.nip05}
                <div class="text-sm flex">
                  {profile.nip05}<Nip05Check
                    {pubkey}
                    nip05Address={profile.nip05}
                  />
                </div>{/if}
              {#if profile.website}<Link
                  className="text-sm underline text-magnum-300 break-all"
                  href={profile.website}>{profile.website}</Link
                >{/if}
            </div>
            <FollowButton {pubkey} />
          </div>
        </div>

        {#if profile.about}
          <div
            class="whitespace-pre-wrap break-words overflow-y-auto mx-4 p-2 rounded-sm"
            style="word-break: break-word; max-height:{bannerHeight}px"
          >
            <Content text={profile.about} tags={metadata.tags} />
          </div>
        {/if}
      </div>
    {/if}
  {/await}
</Metadata>
