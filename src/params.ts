// src/params.ts
import { defineParams } from "@sveltejs/kit/params";
import { NIP05_REGEX } from "./lib/func/regex.ts";


export const params = defineParams({
  note: (param) => {
    return /^(nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,}$/.test(param);
  },

  npub: (param) => {
    return (
      /^npub\w{59}$/.test(param) ||
      /^nprofile\w{59,}$/.test(param) ||
      NIP05_REGEX.test(param)
    );
  },

  naddr: (param) => {
    return /^(naddr)1[023456789acdefghjklmnpqrstuvwxyz]{58,}$/.test(param);
  },

  nostr: (param) => {
    let decodedNostr: string;
    try {
      decodedNostr = decodeURIComponent(param);
    } catch {
      decodedNostr = param;
    }
    return /^(?:web\+)?nostr:\/?\/?/.test(decodedNostr);
  },

  date: (param) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) return false;
    const [y, m, d] = param.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );
  },
});
