declare module "markdown-it-task-checkbox" {
  import MarkdownIt = require("markdown-it");
  declare function mark_plugin(md: MarkdownIt): void;
  export = mark_plugin;
}
