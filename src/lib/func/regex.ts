export const hexRegex = /^[0-9a-fA-F]{64}$/;
//https://api.nostr.watch/v1/nip/50
export const relayRegex =
  /wss?:\/\/[a-zA-Z0-9.-]+(:[0-9]{1,5})?(\/[a-zA-Z0-9._~%+-]*)*/g;
export const relayRegex2 =
  /^wss?:\/\/((([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})|(\d{1,3}\.){3}\d{1,3})(:\d{2,5})?(\/.*)?$/;
//export const relayRegex = /wss?:\/\/\S+/g; ///^wss?:\/\/\S+$/g;
//export const nip33RegexG = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/g;
export const nip33Regex = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/;
export const nip19Regex =
  /nostr:(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,}))/g; //|(nrelay1[023456789acdefghjklmnpqrstuvwxyz]{20,}
export const nsecRegex = /nsec1[023456789acdefghjklmnpqrstuvwxyz]{58,}/;
export const urlRegex = /(https?:\/\/+[^\s"'<`\]]+[^\s"'<`:\].]+)/g;
export const emojiRegex = /(:[^:\s]+:)/g;
export const emojiShortcodeRegex = /^[a-zA-Z0-9_]+$/;

//export const hashtagRegex = /(?<=^|\s)#(?<hashtag>[\p{Letter}\p{Number}_]+)/gu; //(?<hashtag>...) は、名前付きキャプチャグループ
//export const hashtagRegex =
//  /(?<=^|\s)#(?<hashtag>[a-zA-Z\p{XID_Continue}\p{Extended_Pictographic}\p{Emoji_Component}_+-][^#﹟＃\s]+)/gu; //#﹟＃ってかいてあるけど#だけでよくない？https://unicode.org/reports/tr31/#R8-1
export const hashtagRegex =
  /(?:^|\s)#(?<hashtag>[a-zA-Z\p{XID_Continue}\p{Extended_Pictographic}\p{Emoji_Component}_+-][^#﹟＃\s]+)/gu;
export const npubRegex = /^npub\w{59}$/;
export const nipRegex = /NIP-([0-9]{2,})/g;

export const LUD06Regex = /^(LNURL1|lnurl1)[AC-HJ-NP-Z02-9]+$/;
export const LUD16Regex = /^[-_a-zA-Z0-9.]+@[-a-zA-Z0-9.]+$/;
export const NIP05_REGEX = /^(?:([\w.+-]+)@)?([\w_-]+(\.[\w_-]+)+)$/;

export const invoiceRegex =
  /ln(bc|tb|bcrt)([0-9]{1,}[munp]?)1[02-9ac-hj-np-z]{1,}/;
