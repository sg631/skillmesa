import React, { useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";

import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase"; // ensure you export storage from firebase.js

export default function TextEditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileRef = ref(storage, `uploads/${file.name}-${Date.now()}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    editor.update(() => {
      const selection = window.getSelection();
      const imageNode = document.createElement("img");
      imageNode.src = url;
      imageNode.style.maxWidth = "100%";
      selection?.anchorNode?.parentElement?.appendChild(imageNode);
    });
  };

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
      <button onClick={() => fileInputRef.current.click()}>🖼️ Image</button>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
    </div>
  );
}
