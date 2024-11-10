import { createQuery } from "@tanstack/svelte-query";
import { nip05 } from "nostr-tools";
import { derived, writable, type Readable, type Writable } from "svelte/store";
import type { ReqStatus } from "$lib/types";
import { NIP05_REGEX } from "nostr-tools/nip05";

export const useNip05Check = (
  nip05Address: string,
  pubkey: string
): {
  data: Readable<{ result: boolean; error?: string } | undefined | null>;
  status: Writable<ReqStatus>;
  error: Readable<Error>;
} => {
  const genQueryKey = () => ["nip05", nip05Address.toLowerCase()] as const;
  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  const query = createQuery({
    queryKey: genQueryKey(),
    queryFn: () => fetchNip05(pubkey, nip05Address),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // query のデータが変更されたときに実行される derived ストア
  const data = derived(
    query,
    ($query) => {
      if ($query.status === "pending") {
        status.set("loading");
      } else if ($query.status === "success") {
        status.set("success");
      } else if ($query.status === "error") {
        status.set("error");
        error.set($query.error);
      }
      return $query.data;
    },
    null
  );

  return {
    data,
    status,
    error,
  };
};

async function fetchNip05(pubkey: string, fullname: string) {
  const match = fullname.match(NIP05_REGEX);
  if (!match) {
    return { result: false, error: "formatError" }; //"NIP-05 format error" };
  }

  const [, name = "_", domain] = match;
  const url = `https://${domain}/.well-known/nostr.json?name=${name}`;

  try {
    const res = await fetch(url, { redirect: "manual" });

    if (res.status !== 200) {
      return { result: false, error: "fetchResponseError" }; //"Wrong response code" };
    }

    const json = await res.json();
    const registeredPubkey = json.names[name];

    if (!registeredPubkey) {
      return { result: false, error: "noPubkey" }; //"Pubkey not set in nostr.json" };
    }

    return {
      result: registeredPubkey === pubkey,
      error: registeredPubkey === pubkey ? undefined : "impersonation", //"Possibility of impersonation",
    };
  } catch (error) {
    return { result: false, error: "fetchError" }; //"An error occurred during fetch" };
  }
}
