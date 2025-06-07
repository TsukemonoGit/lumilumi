import type MarkdownIt from "markdown-it";

const markdownTaskListPlugin = function (md: MarkdownIt) {
  md.inline.ruler.before("text", "task_checkbox", (state, silent) => {
    const pos = state.pos;
    const checkboxRegex = /^\[([ xX])\]/;

    const match = checkboxRegex.exec(state.src.slice(pos));
    if (match) {
      if (!silent) {
        const isChecked = match[1] !== " ";

        // チェックボックストークン
        const checkboxToken = state.push("task_checkbox", "input", 0);
        checkboxToken.meta = { checked: isChecked };
      }

      state.pos += match[0].length;
      return true;
    }

    return false;
  });
};

export default markdownTaskListPlugin;
