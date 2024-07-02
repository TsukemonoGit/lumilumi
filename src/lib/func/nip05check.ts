import { createQuery } from "@tanstack/svelte-query";
import { nip05 } from "nostr-tools";
import { derived } from "svelte/store";

export type Ogp = {
  title: string;
  image: string;
  description: string;
  favicon: string;
  memo?: string;
};

export let isvalidURL = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export const useNip05Check = (nip05Address: string, pubkey: string) => {
  const genQueryKey = () => ["nip05", nip05Address] as const;

  const query = createQuery({
    queryKey: genQueryKey(),
    queryFn: () => fetchNip05isValid(nip05Address, pubkey),
    staleTime: Infinity, // 古くならないから
    gcTime: 4 * 60 * 60 * 1000, // 4 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    data: derived(query, ($query) => $query.data, null),
  };
};

export const fetchNip05isValid = async (
  nip05Address: string,
  pubkey: string
): Promise<boolean | null> => {
  return await nip05.isValid(pubkey, nip05Address);
};
