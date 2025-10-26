import React, { useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LinkNode } from '@lexical/link'
import Toolbar from "./TextEditorToolbar.jsx";
import { ListNode, ListItemNode } from "@lexical/list"; // ✅ added
import { $getRoot } from "lexical";

function TextEditor({ initialData, onChange }) {
  const editorConfig = {
  namespace: "CustomEditor",
  nodes: [ListNode, ListItemNode, LinkNode], // ✅ add LinkNode here
  theme: {
    paragraph: "editor-paragraph",
    text: {
      bold: "editor-text-bold",
      italic: "editor-text-italic",
      underline: "editor-text-underline",
    },
  },
  onError(error) {
    console.error("Lexical error:", error);
  },
};


  const handleChange = useCallback(
    (editorState) => {
      editorState.read(() => {
        const json = editorState.toJSON();
        if (onChange) onChange(json);
      });
    },
    [onChange]
  );

  return (
    <div className="editor-wrapper">
      <LexicalComposer initialConfig={editorConfig}>
        <Toolbar />
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-content" />}
            placeholder={<div className="editor-placeholder">Start typing...</div>}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <OnChangePlugin onChange={handleChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}

export default TextEditor;
