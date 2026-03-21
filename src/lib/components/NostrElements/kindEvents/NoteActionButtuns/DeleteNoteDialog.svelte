<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { deleteEvent } from "$lib/func/nostr";
  import { generateResultMessage } from "$lib/func/util";
  import { queryClient } from "$lib/stores/stores";
  import { addToast } from "$lib/components/Elements/Toast.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { isReplaceableKind, isAddressableKind } from "nostr-tools/kinds";
  import type { OkPacketAgainstEvent } from "rx-nostr";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import Note from "../Note.svelte";
  import type { Snippet } from "svelte";

  interface Props {
    note: Nostr.Event;
    deleted?: boolean;
    children?: Snippet;
    deleteDialogOpen: boolean;
    onDelete?: () => void;
  }

  let {
    note,
    deleted = $bindable(false),
    deleteDialogOpen = $bindable(false),
    children,
    onDelete,
  }: Props = $props();

  const onClickOK = async () => {
    deleteDialogOpen = false;
    try {
      const deletetags = [
        ["e", note.id],
        ["k", note.kind.toString()],
      ];
      if (isAddressableKind(note.kind) || isReplaceableKind(note.kind)) {
        deletetags.push([
          "a",
          `${note.kind}:${note?.pubkey || ""}:${(note?.tags || []).find((item) => item[0] === "d")?.[1] || ""}`,
        ]);
      }
      const {
        event,
        res,
      }: {
        event: Nostr.Event;
        res: OkPacketAgainstEvent[];
      } = await deleteEvent(deletetags);

      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
      const str = generateResultMessage(isSuccess, isFailed);

      addToast({
        data: {
          title: isSuccess.length > 0 ? "Success" : "Failed",
          description: str,
          color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
        },
      });
      if (isSuccess.length > 0) {
        queryClient.removeQueries({ queryKey: ["note", note.id] });
        deleted = true;
        onDelete?.();
      }
    } catch (error) {
      console.error(error);
      addToast({
        data: {
          title: "Error",
          description: "Failed to delete",
          color: "bg-orange-500",
        },
      });
    }
  };
</script>

<AlertDialog
  bind:open={deleteDialogOpen}
  onClickOK={() => onClickOK()}
  title="Delete"
>
  {#snippet main()}
    <p>{$_("post.delete")}</p>
    {#if children}
      {@render children()}
    {:else}
      <div class="rounded-md border-magnum-600/30 border">
        <Note
          id={note.id}
          displayMenu={false}
          depth={0}
          repostable={false}
          maxHeight={192}
        />
      </div>
    {/if}
  {/snippet}
</AlertDialog>
