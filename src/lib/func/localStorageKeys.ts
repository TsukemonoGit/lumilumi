export const STORAGE_KEYS = {
  TIMELINE_FILTER: "timelineFilter",
  REGEX_FILTER: "globalRegexFilter",
  COLOR_SCHEME: "colorScheme",
  LUMI_EMOJI: "lumiEmoji",

  LUMI_SETTINGS: "lumiSetting",
  LUMI_MUTE: "lumiMute",
  LUMI_MUTE_BY_KIND: "lumiMuteByKind",
  METADATA: "metadata",
  UPLOADER: "uploader",
  THEME: "theme",
  ZAP: "zap",
  SHOW_BANNER: "showBanner",
  BOOKMARK: "kind10003",
  // ポッドキャスト連続再生の並び順（"oldest" | "newest"）
  PODCAST_PLAYBACK_ORDER: "podcastPlaybackOrder",
  // ポッドキャストプレイヤーの音量（"0"〜"1"）とミュート状態（"true" | "false"）
  PODCAST_VOLUME: "podcastVolume",
  PODCAST_MUTED: "podcastMuted",
  // 移行前の旧キー
  OLD_ONLY_FOLLOWEE: "onlyFollowee",
  // 移行後の新キー
  NOTIFI_SETTINGS: "lumi-notifi", //{onluFollowee:boolean,selects:string[]}
};

export const getKind3Key = (pubkey: string) => `kind3-${pubkey}`;
export const getKind10002Key = (pubkey: string) => `kind10002-${pubkey}`;
