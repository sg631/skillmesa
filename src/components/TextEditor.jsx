import React, { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import TextEditorToolbar from "./TextEditorToolbar.jsx";

/**
 * Props:
 *  - initialState: optional serialized editor state JSON string (as saved)
 *  - onChange: optional callback(serializedString) whenever editor updates
 */
export default function TextEditor({ initialState = "", onChange }) {
  const editorRef = useRef(null);

  const editorConfig = {
    namespace: "TextEditor",
    theme: { paragraph: "editor-paragraph" },
    onError(error) {
      console.error("Lexical error:", error);
    },
    nodes: [ListNode, ListItemNode, HeadingNode, QuoteNode, LinkNode],
  };

  return (
    <div className="text-editor">
      <LexicalComposer initialConfig={editorConfig}>
        <EditorInitializer initialState={initialState} editorRef={editorRef} />
        <TextEditorToolbar />
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder">Start typing...</div>}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <ChangeListener editorRef={editorRef} onChange={onChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}

/* Initialize editor once with initialState (if present). Won't re-run while typing */
function EditorInitializer({ initialState, editorRef }) {
  const [editor] = useLexicalComposerContext();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    editorRef.current = editor;

    // Only load once and only if there's a non-empty initialState string
    if (!hasLoadedRef.current && initialState && initialState.trim() !== "") {
      try {
        // parseEditorState exists on editor instance and expects the JSON string you saved with editorState.toJSON()
        const parsed = editor.parseEditorState(initialState);
        editor.setEditorState(parsed);
      } catch (err) {
        console.error("Failed to load initialState (ignored):", err);
        // If load fails, do nothing — editor remains empty and usable
      } finally {
        hasLoadedRef.current = true;
      }
    }
  }, [editor, initialState, editorRef]);

  return null;
}

/* Listen for updates and call onChange with a JSON string (never undefined) */
function ChangeListener({ editorRef, onChange }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onChange) return;

    const unregister = editor.registerUpdateListener(({ editorState }) => {
      // We can call toJSON() on editorState safely
      try {
        const stateJSON = editorState.toJSON();         // JS object
        const serialized = JSON.stringify(stateJSON);   // string to persist
        // Always call with a string (empty document serializes to a minimal object)
        onChange(serialized);
      } catch (err) {
        console.error("Failed to serialize editor state for onChange:", err);
        // Fallback: send empty string (so parent never gets undefined)
        onChange("");
      }
    });

    return () => unregister();
  }, [editor, onChange]);

  return null;
}
