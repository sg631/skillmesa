import React, { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { HEADING, UNORDERED_LIST, ORDERED_LIST, QUOTE } from "@lexical/markdown";

const LIST_TRANSFORMERS = [HEADING, UNORDERED_LIST, ORDERED_LIST, QUOTE];
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ImageNode } from "./ImageNode.jsx";
import { ButtonNode } from "./ButtonNode.jsx";
import { FileRefNode } from "./FileRefNode.jsx";
import TextEditorToolbar from "./TextEditorToolbar.jsx";
import { ListingFilesContext, EditorModeContext } from "./EditorContext.js";

// Defined at module level so the array reference is stable across renders and HMR cycles
// URL and email matchers for AutoLinkPlugin
const URL_MATCHER = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const EMAIL_MATCHER = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const AUTO_LINK_MATCHERS = [
  (text) => {
    const match = URL_MATCHER.exec(text);
    if (!match) return null;
    const url = match[0];
    return { index: match.index, length: url.length, text: url, url: url.startsWith("http") ? url : `https://${url}` };
  },
  (text) => {
    const match = EMAIL_MATCHER.exec(text);
    if (!match) return null;
    return { index: match.index, length: match[0].length, text: match[0], url: `mailto:${match[0]}` };
  },
];

const EDITOR_NODES = [ListNode, ListItemNode, HeadingNode, QuoteNode, LinkNode, AutoLinkNode, ImageNode, ButtonNode, FileRefNode];

/**
 * Props:
 *  - initialState: optional serialized editor state JSON string (as saved)
 *  - onChange: optional callback(serializedString) whenever editor updates
 */
export default function TextEditor({ initialState = "", onChange, listingFiles = [] }) {
  const editorRef = useRef(null);

  const editorConfig = {
    namespace: "TextEditor",
    theme: { paragraph: "editor-paragraph" },
    onError(error) {
      console.error("Lexical error:", error);
    },
    nodes: EDITOR_NODES,
  };

  return (
    <EditorModeContext.Provider value={true}>
    <ListingFilesContext.Provider value={listingFiles}>
    <div className="text-editor">
      <LexicalComposer initialConfig={editorConfig}>
        <EditorInitializer initialState={initialState} editorRef={editorRef} />
        <TextEditorToolbar listingFiles={listingFiles} />
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder">Start typing...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
          <MarkdownShortcutPlugin transformers={LIST_TRANSFORMERS} />
          <ChangeListener editorRef={editorRef} onChange={onChange} />
        </div>
      </LexicalComposer>
    </div>
    </ListingFilesContext.Provider>
    </EditorModeContext.Provider>
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
