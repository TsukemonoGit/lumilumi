import { pipe } from "rxjs";
import { useReq3 } from "$lib/func/reactions";

export function useRepReactionList() {
  const operator = pipe();
  return useReq3({
    operator,
  });
}
