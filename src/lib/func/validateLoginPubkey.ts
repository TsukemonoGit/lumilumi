import { loginUser } from "$lib/stores/stores";
import { get } from "svelte/store";
import * as Nostr from "nostr-typedef";

export const validateLoginPubkey = async (): Promise<{
  status: boolean;
  message?: string;
}> => {
  const user = get(loginUser);
  if (!user || user === "") return { status: false, message: "prease login" };
  try {
    const signPubkey = await (
      window.nostr as Nostr.Nip07.Nostr
    )?.getPublicKey();
    if (user !== signPubkey) {
      return { status: false, message: "login pubkey ≠ sign pubkey" };
    }
    return { status: true };
  } catch (error) {
    return { status: false, message: "failed to get sign pubkey" };
  }
};
