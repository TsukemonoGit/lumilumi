export const relaySearchRelays = [
  //参考 https://nostter.app/nevent1qqsy739r2nqh59p8w4ufwf7ujtp4qxdwjae3uexk5fhn3pf4ntreq8q77psv7
  //kind 0 (ユーザのプロフィール) と kind 10002 (利用中のリレーリスト) 特化
  "wss://directory.yabu.me", //kind0, 3, 10002特化
  //nevent1qvzqqqqqqypzpdc866l8lkwvncdwaqlgrsueg9tvlnm5mm2mpyg3jv8aam445rpqqqsqvjvg63yukccdpfx0285v72skgv59sykpce9jtn3ynmv6jzt0v6qa84j4e
  //nevent1qvzqqqqqqypzpdc866l8lkwvncdwaqlgrsueg9tvlnm5mm2mpyg3jv8aam445rpqqyg8wumn8ghj7mn0wd68ytnhd9hx2qpq7u249qm05a9t83meh7rqxlyxq3gdrtnfswapq2sxly29zxyk0xmq977qva
  "wss://purplepag.es", //https://purplepag.es/what
  "wss://relay.nostr.band",
  //"wss://nos.lol",

  //https://lumilumi.app/nevent1qvzqqqqqqypzp978pfzrv6n9xhq5tvenl9e74pklmskh4xw6vxxyp3j8qkke3cezqqsgfmmcxyknak5frh0jpmp55w2k32l9e9h05qxjvj09hkcf0uh27nclstphx
  //https://github.com/coracle-social/compass
  "wss://indexer.coracle.social",
];

export const defaultRelays = [
  //'wss://tes'
  //'wss://relay.nostr.wirednet.jp'
  "wss://relay.nostr.band",
  "wss://nos.lol",
  // "wss://relayable.org",

  "wss://nostr.bitcoiner.social",
];

//feedback送信用のリレー
export const feedbackRelay = [
  "wss://nos.lol",
  "wss://relay.nostr.wirednet.jp",
  // "wss://relayable.org",

  "wss://relay.nostr.band/",
];
