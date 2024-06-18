<script lang="ts">
  import Metadata from "./Metadata.svelte";
  import { profile, splitHexColorString } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import { showImg } from "$lib/stores/stores";
  import UserAvatar from "../Elements/UserAvatar.svelte";
  import Avatar from "svelte-boring-avatars";
  import Content from "../Note/Content.svelte";

  export let pubkey: string;
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
          <div class="relative z-10 border border-magnum-400 rounded-full">
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
          <div class="ml-3 flex flex-col justify-center mt-auto pb-2">
            <div class="sm:text-xl text-md font-bold">
              {profile.display_name ?? ""}@{profile.name}
            </div>
            <div class="text-sm text-neutral-500"></div>
            <div class="text-sm">{profile.nip05}</div>
            <div class="text-sm">{profile.website}</div>
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