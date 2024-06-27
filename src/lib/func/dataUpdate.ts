import { getFollowingList } from "./nostr";

export const isfolloweeFunc = (pubkey: string): boolean | undefined => {
  const list = getFollowingList();
  if (!list) {
    return undefined;
  } else {
    return list.includes(pubkey);
  }
};
