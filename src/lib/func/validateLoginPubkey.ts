import { get } from "svelte/store";
import * as Nostr from "nostr-typedef";
import { loginUser, lumiSetting } from "$lib/stores/globalRunes.svelte";

export const validateLoginPubkey = async (): Promise<{
  status: boolean;
  message?: string;
}> => {
  const user = lumiSetting.get().pubkey;
  if (!user || user === "") return { status: false, message: "prease login" };
  try {
    if (!loginUser.value) {
      const pubkey = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
      if (pubkey) {
        loginUser.value = pubkey;
      }
    }
    if (user !== loginUser.value) {
      return { status: false, message: "login pubkey ≠ sign pubkey" };
    }
    return { status: true };
  } catch (error) {
    return { status: false, message: "failed to get sign pubkey" };
  }
};
