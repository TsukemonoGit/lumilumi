declare module "markdown-it-sub" {
  import MarkdownIt = require("markdown-it");
  declare function sub_plugin(md: MarkdownIt): void;
  export = sub_plugin;
}
