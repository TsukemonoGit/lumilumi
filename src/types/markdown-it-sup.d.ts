declare module "markdown-it-sup" {
  import MarkdownIt = require("markdown-it");
  declare function sup_plugin(md: MarkdownIt): void;
  export = sup_plugin;
}
