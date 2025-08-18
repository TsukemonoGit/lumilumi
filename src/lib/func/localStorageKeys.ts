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
  // 移行前の旧キー
  OLD_ONLY_FOLLOWEE: "onlyFollowee",
  // 移行後の新キー
  NOTIFI_SETTINGS: "lumi-notifications", //{onluFollowee:boolean,selects:string[]}
};

export const getKind3Key = (pubkey: string) => `kind3-${pubkey}`;
