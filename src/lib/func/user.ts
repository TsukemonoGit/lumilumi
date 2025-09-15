import { tick } from "svelte";
import type { UserData } from "./nostr";
import { displayShortPub } from "./util";

export function checkUserInput(input: string, userData: UserData) {
  if (input === "") return true;

  const searchTerm = input.toLowerCase();

  return (
    (userData.name && userData.name.toLowerCase().includes(searchTerm)) ||
    (userData.display_name &&
      userData.display_name.toLowerCase().includes(searchTerm)) ||
    (userData.nip05 && userData.nip05.toLowerCase().includes(searchTerm)) ||
    (userData.petname && userData.petname.toLowerCase().includes(searchTerm))
  );
}

export function userName(pubkey: string, profile: UserData) {
  if (profile.petname) {
    return `📛${profile.petname}`;
  }

  if (
    (!profile.display_name || profile.display_name === "") &&
    (!profile.name || profile.name === "")
  ) {
    return displayShortPub(pubkey);
  }

  return `${profile.display_name ?? ""}${
    profile.name ? `@${profile.name}` : ""
  }`;
}
