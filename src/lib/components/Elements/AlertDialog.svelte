<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { writable, type Writable } from "svelte/store";
  import CloseButton from "./CloseButton.svelte";

  interface Props {
    onClickOK: () => void;
    title?: string;
    description?: string;
    okButtonName?: string | undefined;
    main?: import("svelte").Snippet;
    openDialog?: (bool: boolean) => void;
    closeOnOutsideClick?: boolean;
    dialogStatus?: Writable<boolean>;
  }

  let {
    onClickOK,
    title = "",
    description = "",
    okButtonName = undefined,
    main,
    openDialog = $bindable(),
    dialogStatus = $bindable(writable(false)),
    closeOnOutsideClick = true,
  }: Props = $props();

  const {
    elements: {
      trigger,
      overlay,
      content,
      title: ttl,
      description: dsc,
      close,
      portalled,
    },
    states: { open: openEle },
  } = createDialog({
    role: "alertdialog",
    forceVisible: true,
    closeOnOutsideClick: closeOnOutsideClick,
  });

  openDialog = (bool: boolean) => {
    $openEle = bool;
  };
  // export { open };
  openEle.subscribe((value) => {
    $dialogStatus = value;
  });
</script>

{#if $openEle}
  <div class="" use:melt={$portalled}>
    <div use:melt={$overlay} class="fixed inset-0 z-50 bg-black/50"></div>
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(min(96vw,720px))]
             -translate-x-1/2 -translate-y-1/2 rounded-md bg-neutral-800
            p-6 shadow-lg"
      use:melt={$content}
    >
      <h2 use:melt={$ttl} class="m-0 text-lg font-medium text-zinc-200">
        {title}
      </h2>
      <p use:melt={$dsc} class="mb-5 mt-2 leading-normal text-zinc-400">
        {description}
      </p>

      <div class="mb-4 text-zinc-200">
        {@render main?.()}
      </div>

      <div class="mt-6 flex justify-end gap-4">
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-[4px]
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          Cancel
        </button>
        <button
          class="inline-flex h-8 items-center justify-center rounded-[4px]
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900"
          onclick={onClickOK}
        >
          {okButtonName ? okButtonName : "Continue"}
        </button>
      </div>

      <CloseButton useMelt={$close} ariaLabel="close" />
    </div>
  </div>
{/if}
