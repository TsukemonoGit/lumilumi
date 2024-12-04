export const eventKinds = new Map<number, { ja: string; en: string }>([
  [
    0,
    {
      ja: "メタデータ",
      en: "Metadata",
    },
  ],
  [
    1,
    {
      ja: "テキストノート",
      en: "Short Text Note",
    },
  ],
  //
  [
    3,
    {
      ja: "フォローリスト",
      en: "Follows",
    },
  ],
  [
    4,
    {
      ja: "暗号化されたダイレクトメッセージ",
      en: "Encrypted Direct Messages",
    },
  ],
  [
    5,
    {
      ja: "イベント削除リクエスト",
      en: "Event Deletion Request",
    },
  ],
  [
    6,
    {
      ja: "リポスト",
      en: "Repost",
    },
  ],
  [
    7,
    {
      ja: "リアクション",
      en: "Reaction",
    },
  ],
  [
    8,
    {
      ja: "バッジ アワード",
      en: "Badge Award",
    },
  ],
  [
    9,
    {
      ja: "グループチャットメッセージ",
      en: "Group Chat Message",
    },
  ],
  [
    10,
    {
      ja: "グループチャット スレッド返信",
      en: "Group Chat Threaded Reply",
    },
  ],
  [
    11,
    {
      ja: "グループスレッド",
      en: "Group Thread",
    },
  ],
  [
    12,
    {
      ja: "グループスレッド返信",
      en: "Group Thread Reply",
    },
  ],
  [
    13,
    {
      ja: "シール",
      en: "Seal",
    },
  ],
  [
    14,
    {
      ja: "ダイレクト・メッセージ",
      en: "Direct Message",
    },
  ],
  //
  [
    16,
    {
      ja: "汎用リポスト",
      en: "Generic Repost",
    },
  ],
  [
    17,
    {
      ja: "ウェブサイトへの反応",
      en: "Reaction to a website",
    },
  ],
  //
  [
    20,
    {
      ja: "画像フィード",
      en: "Picture-first feeds",
    },
  ],
  //
  [
    40,
    {
      ja: "チャンネル作成",
      en: "Channel Creation",
    },
  ],
  [
    41,
    {
      ja: "チャンネルのメタデータ",
      en: "Channel Metadata",
    },
  ],
  [
    42,
    {
      ja: "チャンネルメッセージ",
      en: "Channel Message",
    },
  ],
  [
    43,
    {
      ja: "チャンネル非表示メッセージ",
      en: "	Channel Hide Message",
    },
  ],
  [
    44,
    {
      ja: "チャンネルミュートユーザー",
      en: "Channel Mute User",
    },
  ],
  //

  [
    64,
    {
      ja: "チェス",
      en: "Chess (PGN)",
    },
  ],
  //

  [
    818,
    {
      ja: "リクエストのマージ",
      en: "Merge Requests",
    },
  ],
  //

  [
    1021,
    {
      ja: "入札",
      en: "Bid",
    },
  ],
  [
    1022,
    {
      ja: "入札確認",
      en: "Bid confirmation",
    },
  ],
  //
  //～～～～～～
  //
  [
    9734,
    {
      ja: "Zap リクエスト",
      en: "Zap Request",
    },
  ],
  [
    9735,
    {
      ja: "Zap レシート",
      en: "Zap Receipt",
    },
  ],
  //
  //～～～～～～
  //

  [
    10000,
    {
      ja: "ミュートリスト",
      en: "Mute list",
    },
  ],
  [
    10001,
    {
      ja: "ピンリスト",
      en: "Pin list",
    },
  ],
  [
    10002,
    {
      ja: "リレーリストのメタデータ",
      en: "Relay List Metadata",
    },
  ],
  [
    10003,
    {
      ja: "ブックマークリスト",
      en: "Bookmark list",
    },
  ],
  [
    10004,
    {
      ja: "コミュニティリスト",
      en: "Communities list",
    },
  ],
  [
    10005,
    {
      ja: "パブリックチャットリスト",
      en: "Public chats list",
    },
  ],
  [
    10006,
    {
      ja: "ブロックリレーリスト",
      en: "Blocked relays list",
    },
  ],
  [
    10007,
    {
      ja: "検索リレーリスト",
      en: "Search relays list",
    },
  ],
  [
    10009,
    {
      ja: "ユーザーグループ",
      en: "User groups",
    },
  ],
  //
  [
    10015,
    {
      ja: "興味・関心リスト",
      en: "Interests list",
    },
  ],
  [
    10019,
    {
      ja: "ナッツザップ情報イベント",
      en: "Nutzap informational event",
    },
  ],
  //
  //んあ～～～～～～
  //

  [
    10030,
    {
      ja: "絵文字リスト",
      en: "User emoji list",
    },
  ],
  //
  //んあ～～～～～～
  //

  [
    30000,
    {
      ja: "ユーザーリストセット",
      en: "Follow sets",
    },
  ],
  [
    30001,
    {
      ja: "汎用リストセット",
      en: "Generic lists",
    },
  ],
  [
    30002,
    {
      ja: "リレーリストセット",
      en: "Relay sets",
    },
  ],
  [
    30003,
    {
      ja: "ブックマークリストセット",
      en: "Bookmark sets",
    },
  ],
  [
    30004,
    {
      ja: "記事のキュレーションセット",
      en: "Article Curation Sets",
    },
  ],
  [
    30005,
    {
      ja: "ビデオのキュレーションセット",
      en: "Video Curation Sets",
    },
  ],
  //
  [
    30007,
    {
      ja: "Kind別ミュートセット",
      en: "Kind mute sets",
    },
  ],
  //
  //んあ～～～～～～
  //

  [
    30023,
    {
      ja: "記事",
      en: "Long-form Content",
    },
  ],
  [
    30024,
    {
      ja: "記事の草稿",
      en: "Draft Long-form Content",
    },
  ],
  //

  [
    30030,
    {
      ja: "絵文字セット",
      en: "Emoji sets",
    },
  ],
  ////
  [
    30078,
    {
      ja: "アプリケーション固有データ",
      en: "Application-specific Data",
    },
  ],
  ////
  [
    30311,
    {
      ja: "ライブイベント",
      en: "Live Event",
    },
  ],
  ////
  [
    30315,
    {
      ja: "ユーザーステータス",
      en: "User Statuses",
    },
  ],
  //

  //
  //

  [
    31990,
    {
      ja: "アプリ情報",
      en: "Handler information",
    },
  ],
]);
/*

[
  ,
  {
    ja: "",
    en: "",
  },
],
*/
