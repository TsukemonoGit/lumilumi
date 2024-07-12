import { createQuery } from "@tanstack/svelte-query";
import { nip05 } from "nostr-tools";
import { derived, writable, type Readable, type Writable } from "svelte/store";
import type { ReqStatus } from "$lib/types";

export const useNip05Check = (
  nip05Address: string,
  pubkey: string
): {
  data: Readable<boolean | null | undefined>;
  status: Writable<ReqStatus>;
  error: Readable<Error>;
} => {
  const genQueryKey = () => ["nip05", nip05Address] as const;
  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  const query = createQuery({
    queryKey: genQueryKey(),
    queryFn: async () => {
      try {
        const res = await nip05.isValid(pubkey, nip05Address);
        return res;
      } catch (e) {
        throw e;
      }
    },
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
