import { pipe } from "rxjs";
import { useReq3 } from "$lib/func/reactions";
import { uniq } from "rx-nostr";

export function useRepReactionList() {
  const operator = pipe();
  return useReq3({
    operator,
  });
}
