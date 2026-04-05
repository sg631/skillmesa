import React, { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ImageNode } from "./ImageNode.jsx";

function StateLoader({ content }) {
  const [editor] = useLexicalComposerContext();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !content || !content.trim()) return;
    try {
      editor.setEditorState(editor.parseEditorState(content));
    } catch (e) {
      console.error("RichContentView: failed to parse state", e);
    }
    loaded.current = true;
  }, [editor, content]);

  return null;
}

/**
 * Read-only Lexical renderer.
 * Props: content (JSON string as saved by TextEditor onChange)
 */
export default function RichContentView({ content }) {
  if (!content || !content.trim()) return null;

  const config = {
    namespace: "RichContentView",
    editable: false,
    theme: { paragraph: "editor-paragraph" },
    nodes: [ListNode, ListItemNode, HeadingNode, QuoteNode, LinkNode, ImageNode],
    onError(e) { console.error("RichContentView error:", e); },
  };

  return (
    <div className="text-editor" style={{ border: 'none', background: 'transparent', maxWidth: '100%' }}>
      <LexicalComposer initialConfig={config}>
        <StateLoader content={content} />
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" style={{ minHeight: 'unset', padding: 0 }} />}
          placeholder={null}
        />
        <ListPlugin />
        <LinkPlugin />
      </LexicalComposer>
    </div>
  );
}
