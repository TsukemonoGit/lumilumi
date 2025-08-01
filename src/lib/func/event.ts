import type { Profile } from "$lib/types";

import * as Nostr from "nostr-typedef";
import { hexRegex, nip33Regex } from "./regex";
import type { Ogp } from "./ogp";
import { isAddressableKind, isReplaceableKind } from "nostr-tools/kinds";
import * as nip19 from "nostr-tools/nip19";
import { getRelaysById } from "./nostr";

export const repostedId = (
  tags: string[][]
): { tag: string[] | undefined; kind: number | undefined } => {
  const kindtag = tags.find((tag) => tag[0] === "k");
  const kind = kindtag ? Number(kindtag[1]) : undefined;
  return {
    tag: tags
      .slice()
      .reverse()
      .find(
        (tag) =>
          (tag[0] === "e" && hexRegex.test(tag[1])) ||
          (tag[0] === "a" && nip33Regex.test(tag[1]))
      ),
    kind: kind,
  };
};

export const replyedEvent = (
  tags: string[][],
  kind: number
): { replyTag: string[] | undefined; replyUsers: string[] } => {
  // Handle NIP-22 events (kind 1111)
  if (kind === 1111) {
    // Extract unique pubkeys from p or P tags
    const users = Array.from(
      new Set(
        tags.reduce((acc, [tag, value]) => {
          if ((tag === "p" || tag === "P") && hexRegex.test(value)) {
            acc.push(value);
          }
          return acc;
        }, [] as string[])
      )
    );

    // First try to find a lowercase tag (e/a/i)
    const ID = tags?.find(
      (tag) =>
        (tag[0] === "e" && hexRegex.test(tag[1])) ||
        (tag[0] === "a" && nip33Regex.test(tag[1])) ||
        tag[0] === "i"
    );

    if (ID) {
      return { replyUsers: users, replyTag: ID };
    }

    // Otherwise check for uppercase tags (E/A/I)
    const parentID = tags?.find(
      (tag) =>
        (tag[0] === "E" && hexRegex.test(tag[1])) ||
        (tag[0] === "A" && nip33Regex.test(tag[1])) ||
        tag[0] === "I"
    );

    return { replyUsers: users, replyTag: parentID };
  }

  // Handle non-NIP-22 events
  // Extract pubkeys from p tags
  const users = tags.reduce((acc, [tag, value]) => {
    if (tag === "p" && hexRegex.test(value)) {
      return [...acc, value];
    }
    return acc;
  }, [] as string[]);

  // Find all e and a tags
  const IDs = tags.filter(
    (tag) => tag[0] === "e" && hexRegex.test(tag[1]) //||(tag[0] === "a" && nip33Regex.test(tag[1]))
  );

  // Find special tags
  const root = IDs.find((item) => item.length > 3 && item[3] === "root");
  const reply = IDs.find((item) => item.length > 3 && item[3] === "reply");

  // Find simple tags (without root/reply marker)
  const simpleTags = IDs.filter(
    (item) => !(item.length > 3 && (item[3] === "reply" || item[3] === "root"))
  );

  let replyTag;

  // For kind 42 (group chats), use different logic
  if (kind === 42 && root) {
    replyTag = reply ?? IDs.findLast((item) => item !== root);
  } else {
    // Priority: reply > simple tags > root
    replyTag =
      reply ??
      (simpleTags.length > 0 ? simpleTags[simpleTags.length - 1] : root);
  }

  return { replyUsers: users, replyTag };
};

export function extractZappedId(tags: string[][]): {
  tag: string[];
} {
  const eTag = tags?.find(
    (tag) =>
      (tag[0] === "e" && hexRegex.test(tag[1])) ||
      (tag[0] === "a" && nip33Regex.test(tag[1]))
  );
  //console.log(eTag);
  return {
    tag: eTag ? (eTag as string[]) : [],
  };
}

// 一致するIDを1つだけ削除するヘルパー関数
export function removeFirstMatchingId(
  viewEventIds: string[][],
  tag: string[] | undefined
): string[][] {
  if (!tag) return viewEventIds; // tagがundefinedの場合は何もしない

  const index = viewEventIds.findIndex(
    (item: string[]) => item[0] === tag[0] && item[1] === tag[1]
  );
  if (index !== -1) {
    viewEventIds.splice(index, 1); // 一致する1つだけ削除
  }
  return viewEventIds;
}

export const getProfile = (
  ev: Nostr.Event | undefined
): Profile | undefined => {
  if (!ev) return undefined;
  try {
    return JSON.parse(ev.content);
  } catch {
    return undefined;
  }
};

export function latestList(list: Nostr.Event[]): Nostr.Event[] {
  //key値 `${list[i].kind}:${list[i].pubkey}:${list[i].tags.find((tag)=>tag[0]==="d"&&tag.length>1)?.[1]}`

  //キー値が同じものはlist[i].created_atが最新のものを採用する

  const map = list.reduce((acc, event) => {
    const key = `${event.kind}:${event.pubkey}:${
      event.tags.find((tag) => tag[0] === "d" && tag.length > 1)?.[1]
    }`;

    // 既存のイベントが無い、もしくは現在のイベントがより新しい場合に更新
    if (!acc.has(key) || event.created_at > acc.get(key)!.created_at) {
      acc.set(key, event);
    }

    return acc;
  }, new Map<string, Nostr.Event>());

  return Array.from(map.values());
}

export const get31990Ogp = (
  ev: Nostr.Event
): { ogp: Ogp; url: string } | undefined => {
  try {
    const data = JSON.parse(ev.content);
    return {
      ogp: {
        title: data.name,
        image: data.banner,
        description: data.about,
        favicon: data.picture,
      } as Ogp,
      url: data.website,
    };
  } catch (error) {
    return undefined;
  }
};

export const checkBirthDay = (prof: Profile | undefined): boolean => {
  if (!prof) return false;
  if (prof.birthday) {
    return isTodayBirthday(prof.birthday.day, prof.birthday.month);
  } else if (prof.birth && Array.isArray(prof.birth) && prof.birth.length > 1) {
    return isTodayBirthday(prof.birth[0], prof.birth[1]);
  }
  return false;
};

const isTodayBirthday = (
  day: number | undefined,
  month: number | undefined
): boolean => {
  if (!day || !month) return false;
  const now = new Date();
  const thisYear = now.getFullYear();
  const birthday = new Date(thisYear, month - 1, day);
  // 今年がうるう年じゃなかったらここで 2/29 は勝手に 3/1 になる
  // うるうだったら2/29のまま

  return (
    //今年の誕生日====//今日
    birthday.getMonth() === now.getMonth() &&
    birthday.getDate() === now.getDate()
  );
};

export const checkContentWarning = (tags: string[][]): string[] | undefined => {
  return tags.find((item) => item[0] === "content-warning");
};

export const noteLink = (note: Nostr.Event): string /**nevent or naddr */ => {
  let replaceable =
    note && (isReplaceableKind(note.kind) || isAddressableKind(note.kind));

  if (!replaceable) {
    let eventpointer: nip19.EventPointer = {
      id: note.id,
      relays: getRelaysById(note.id),
      author: note.pubkey,
      kind: note.kind,
    };
    return nip19.neventEncode(eventpointer);
  } else {
    let naddrpointer: nip19.AddressPointer = {
      kind: note.kind,
      identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
      pubkey: note.pubkey,
      relays: getRelaysById(note.id),
    };
    return nip19.naddrEncode(naddrpointer);
  }
};
