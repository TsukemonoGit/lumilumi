<script lang="ts">
  import Metadata from "../NostrMainData/Metadata.svelte";
  import { profile, splitHexColorString } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import { showImg } from "$lib/stores/stores";
  import { _ } from "svelte-i18n";

  import { beforeNavigate } from "$app/navigation";
  import Nip05Check from "../NostrMainData/Nip05Check.svelte";
  import Link from "./Link.svelte";
  import FollowButton from "../NostrElements/Note/FollowButton.svelte";
  import Content from "../NostrElements/Note/Content.svelte";
  import UserAvatar from "./UserAvatar.svelte";
  import Avatar from "svelte-boring-avatars";
  import UserZap from "./UserZap.svelte";

  export let pubkey: string;
  export let bannerHeight: number = 180;
  export let iconSize: number = 80;
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
                name={prof.name ?? ""}
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
        <div class="absolute bottom-1 right-2"><FollowButton {pubkey} /></div>
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
          {#if prof.lud16 || prof.lud06}
            <div class=" w-fit"><UserZap {metadata} /></div>
          {/if}
        </div>
        {#if prof.nip05}
          <div class="text-sm flex break-all">
            {prof.nip05}<Nip05Check {pubkey} nip05Address={prof.nip05} />
          </div>{/if}
        {#if prof.website}<Link
            className="text-sm underline text-magnum-300 break-all  "
            href={prof.website}>{prof.website}</Link
          >{/if}
      </div>

      {#if prof.about}
        <div
          class="whitespace-pre-wrap break-words overflow-y-auto mt-2 rounded-sm"
          style="word-break: break-word; max-height:{bannerHeight * 1.5}px"
        >
          <Content text={prof.about} tags={metadata.tags} />
        </div>
      {/if}
    </div>
  {/if}
</Metadata>