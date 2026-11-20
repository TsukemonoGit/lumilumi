import type * as Nostr from "nostr-typedef";

// NIP-F4 Podcasts のイベントをUIで扱いやすい形に変換するヘルパー群。
// 仕様: https://github.com/nostr-protocol/nips/blob/master/F4.md
// kind:10154 = 番組メタデータ（置換可能）, kind:54 = エピソード

export interface PodcastShow {
  event: Nostr.Event;
  pubkey: string;
  title: string | undefined;
  image: string | undefined;
  description: string | undefined;
  websites: string[];
  hosts: { pubkey: string; role: string | undefined }[];
}

export interface PodcastAudio {
  url: string;
  type: string | undefined;
}

export interface PodcastEpisode {
  event: Nostr.Event;
  id: string;
  pubkey: string;
  title: string | undefined;
  image: string | undefined;
  description: string | undefined;
  content: string;
  audio: PodcastAudio[];
  websites: string[];
  externalIds: string[];
  createdAt: number;
}

// グローバルプレイヤーの再生キューに積む単位。
// 1エピソードにつき1トラック（複数audioがある場合は先頭を採用）。
export interface PodcastTrack {
  eventId: string;
  url: string;
  title: string | undefined;
  showTitle: string | undefined;
  showImage: string | undefined;
  showPubkey: string;
  website: string | undefined;
}

/** 指定したタグ名を持つタグをすべて返す */
export function getTagValues(tags: string[][], name: string): string[][] {
  return (tags || []).filter((tag) => tag[0] === name);
}

/** 指定したタグ名の最初の値を返す */
export function getTagValue(
  tags: string[][],
  name: string,
): string | undefined {
  const tag = (tags || []).find((tag) => tag[0] === name && tag.length > 1);
  return tag?.[1];
}

/** kind:10154 のイベントを番組情報に変換する */
export function parsePodcastShow(event: Nostr.Event): PodcastShow {
  const tags = event.tags || [];
  return {
    event,
    pubkey: event.pubkey,
    title: getTagValue(tags, "title"),
    image: getTagValue(tags, "image"),
    description: getTagValue(tags, "description"),
    websites: getTagValues(tags, "website")
      .map((tag) => tag[1])
      .filter((url): url is string => typeof url === "string" && url !== ""),
    hosts: getTagValues(tags, "p")
      .filter((tag) => tag.length > 1)
      .map((tag) => ({ pubkey: tag[1], role: tag[2] })),
  };
}

/** kind:54 のイベントをエピソード情報に変換する */
export function parsePodcastEpisode(event: Nostr.Event): PodcastEpisode {
  const tags = event.tags || [];
  const seenAudio = new Set<string>();
  const audio: PodcastAudio[] = [];
  for (const tag of getTagValues(tags, "audio")) {
    const url = tag[1];
    if (!url || seenAudio.has(url)) continue;
    seenAudio.add(url);
    audio.push({ url, type: tag[2] });
  }

  return {
    event,
    id: event.id,
    pubkey: event.pubkey,
    title: getTagValue(tags, "title"),
    image: getTagValue(tags, "image"),
    description: getTagValue(tags, "description"),
    content: event.content || "",
    audio,
    websites: getTagValues(tags, "r")
      .map((tag) => tag[1])
      .filter((url): url is string => typeof url === "string" && url !== ""),
    externalIds: getTagValues(tags, "i")
      .map((tag) => tag[1])
      .filter((id): id is string => typeof id === "string" && id !== ""),
    createdAt: event.created_at,
  };
}

/**
 * 同じ pubkey のイベントが複数ある場合に created_at が最新のものだけを残す。
 * kind:10154 は置換可能イベントなので、リレーごとに古い版が返ることがある。
 */
export function latestByPubkey(events: Nostr.Event[]): Nostr.Event[] {
  const latest = new Map<string, Nostr.Event>();
  for (const event of events) {
    const current = latest.get(event.pubkey);
    if (!current || current.created_at < event.created_at) {
      latest.set(event.pubkey, event);
    }
  }
  return [...latest.values()];
}

/** エピソードを新しい順に並べる */
export function sortEpisodesDesc(events: Nostr.Event[]): Nostr.Event[] {
  return [...events].sort((a, b) => b.created_at - a.created_at);
}

export type PodcastEpisodeOrder = "oldest" | "newest";

/**
 * エピソードを再生順に並べる。
 * ポッドキャストは1話から順に聴くことが多いため、既定は古い順を想定する。
 */
export function orderEpisodes(
  events: Nostr.Event[],
  order: PodcastEpisodeOrder,
): Nostr.Event[] {
  return [...events].sort((a, b) =>
    order === "oldest"
      ? a.created_at - b.created_at
      : b.created_at - a.created_at,
  );
}

/**
 * エピソード群から再生キューを組み立てる。
 * audio タグを持たないエピソードは再生できないため除外する。
 */
export function buildPodcastTracks(
  episodes: PodcastEpisode[],
  show?: PodcastShow,
): PodcastTrack[] {
  return episodes.flatMap((episode) => {
    const audio = episode.audio[0];
    if (!audio) return [];
    return [
      {
        eventId: episode.id,
        url: audio.url,
        title: episode.title,
        showTitle: show?.title,
        showImage: episode.image ?? show?.image,
        showPubkey: episode.pubkey,
        website: episode.websites[0],
      },
    ];
  });
}

/** 秒数をプレイヤー表示用の mm:ss / h:mm:ss に変換する */
export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${minutes}:${pad(secs)}`;
}

/**
 * ショーノート内のタイムスタンプを秒に変換する。
 * 対応形式: 00:00 / 1:02:03 / 34'57" / 1:01'20"
 * 不正な形式は NaN を返す。
 */
export function timestampToSeconds(timestamp: string): number {
  // ポッドキャストのショーノートでは "12'34\"" のような
  // 分'秒" 形式も一般的なため、: 区切りと同じように扱う
  const normalized = timestamp.replace(/["”″]/g, "").replace(/'/g, ":");
  const parts = normalized.split(":");
  if (parts.length < 2 || parts.length > 3) return NaN;
  if (parts.some((part) => !/^\d{1,2}$/.test(part))) return NaN;
  const numbers = parts.map(Number);
  if (parts.length === 2) {
    const [minutes, seconds] = numbers;
    if (seconds >= 60) return NaN;
    return minutes * 60 + seconds;
  }
  const [hours, minutes, seconds] = numbers;
  if (minutes >= 60 || seconds >= 60) return NaN;
  return hours * 3600 + minutes * 60 + seconds;
}
