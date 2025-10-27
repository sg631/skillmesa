import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import {
  TOGGLE_LINK_COMMAND,
  $isLinkNode,
} from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";

export default function TextEditorToolbar() {
  const [editor] = useLexicalComposerContext();

  // 🔗 Link toggle handler
  const handleLinkClick = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const node = selection.anchor.getNode();
      const isLink = $isLinkNode(node.getParent());

      if (isLink) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      } else {
        const url = window.prompt("Enter a link URL:");
        if (url) {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }
      }
    });
  };

  // ⚡ Ctrl+click link navigation
  React.useEffect(() => {
    const container = document.querySelector(".editor-input");
    if (!container) return;

    const handleClick = (e) => {
      const link = e.target.closest("a");
      if (link && e.ctrlKey) {
        e.preventDefault();
        const shouldGo = window.confirm(`Open link? \n${link.href}`);
        if (shouldGo) window.open(link.href, "_blank");
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="toolbar">
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
        <b>B</b>
      </button>
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
        <i>I</i>
      </button>
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>
        <u>U</u>
      </button>
      <button onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND)}>
        • List
      </button>
      <button onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND)}>
        1. List
      </button>
      <button onClick={handleLinkClick}>🔗 Link</button>
    </div>
  );
}
