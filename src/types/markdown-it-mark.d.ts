declare module "markdown-it-mark" {
  import MarkdownIt = require("markdown-it");
  declare function mark_plugin(md: MarkdownIt): void;
  export = mark_plugin;
}
