<script lang="ts">
  import { nowProgress, queryClient, toastSettings } from "$lib/stores/stores";
  import { createDialog, melt } from "@melt-ui/svelte";
  import { X } from "lucide-svelte";

  import { fade } from "svelte/transition";
  import * as Nostr from "nostr-typedef";
  import type { EventPacket } from "rx-nostr";
  import { publishEvent } from "$lib/func/nostr";
  const {
    elements: {
      trigger,
      overlay,
      content,
      title,
      description,
      close,
      portalled,
    },
    states: { open },
  } = createDialog({
    forceVisible: true,
  });

  export { trigger };

  let userStatus: string = "";
  let userURL: string = "";
  //  $open = true;

  open.subscribe(async (value) => {
    console.log(value);
    if (value && !$nowProgress) {
      $nowProgress = true;
      try {
        const pubkey = await (
          window.nostr as Nostr.Nip07.Nostr
        )?.getPublicKey();
        //throw Error("failed to get pubkey");
        if (!pubkey) {
          throw Error("failed to get pubkey");
        }
        const statusEvent: EventPacket | undefined = $queryClient?.getQueryData(
          ["userStatus", "general", pubkey]
        );
        console.log(statusEvent);
        if (statusEvent) {
          userStatus = statusEvent.event.content;
          userURL =
            statusEvent.event.tags.find((tag) => tag[0] === "r")?.[1] ?? "";
        }
        $nowProgress = false;
      } catch (error: any) {
        if (error?.message) {
          $toastSettings = {
            title: "Error",
            description: error.message,
            color: "bg-orange-500",
          };
        }
        $toastSettings = {
          title: "Error",
          description: "failed to get pubkey",
          color: "bg-orange-500",
        };
        $nowProgress = false;
      }
    }
  });

  const handleClickSave = () => {
    $nowProgress = true;

    const tags = [["d", "general"]];
    if (userURL.trim() !== "") {
      tags.push(["r", userURL]);
    }
    const newStatus: Nostr.EventParameters = {
      kind: 30315,
      tags: tags,
      content: userStatus,
    };
    publishEvent(newStatus);
    $toastSettings = {
      title: "Published",
      description: "",
      color: "bg-green-500",
    };
    $nowProgress = false;
    $open = false;
  };
</script>

{#if $open}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    />
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
            max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
            p-6 shadow-lg"
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 text-lg font-medium text-magnum-300">
        Edit status
      </h2>
      <!-- <p use:melt={$description} class="mb-5 mt-2 leading-normal text-zinc-600">
        Make changes to your profile here. Click save when you're done.
      </p> -->

      <fieldset class="mb-4 mt-4 flex flex-col gap-2">
        <label class=" text-zinc-100" for="status"> Status </label>
        <input
          class="h-8 w-full
                    rounded-sm border border-solid px-1 leading-none text-zinc-100"
          id="status"
          type="text"
          bind:value={userStatus}
        />
      </fieldset>
      <fieldset class="mb-4 flex flex-col items-start gap-2">
        <label class=" text-zinc-100" for="URL"> URL </label>
        <input
          class="h-8 w-full
                    rounded-sm border border-solid px-1 leading-none text-zinc-100"
          id="URL"
          type="url"
          bind:value={userURL}
          placeholder="https://"
        />
      </fieldset>
      <div class="mt-6 flex justify-end gap-4">
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          Cancel
        </button>
        <button
          on:click={handleClickSave}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900"
        >
          Save changes
        </button>
      </div>
      <button
        use:melt={$close}
        aria-label="close"
        class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                items-center justify-center rounded-full p-1 text-magnum-800
                hover:bg-magnum-100 focus:shadow-magnum-400"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
{/if}
