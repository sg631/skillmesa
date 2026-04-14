import { DecoratorNode, $getNodeByKey } from "lexical";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { Popover, Stack, TextInput, Group, Button, Box, Divider, Progress } from "@mantine/core";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebase.js";

// ── EditableImage — selection, resize handles, inline popover ─────────────────
function EditableImage({ src, alt, width, nodeKey, editor }) {
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [editing, setEditing] = useState(!src);
  const [draftSrc, setDraftSrc] = useState(src || "");
  const [draftAlt, setDraftAlt] = useState(alt || "");
  const [uploadProgress, setUploadProgress] = useState(null); // null = idle, 0–100 = uploading
  const fileInputRef = useRef(null);
  const isNew = useRef(!src);
  const imgRef = useRef(null);
  const dragRef = useRef({ startX: 0, startWidth: 0 });
  const [dragWidth, setDragWidth] = useState(null);

  // Reopen popover if node is brought back to empty state (e.g. undo after save)
  useEffect(() => {
    if (!src) {
      setDraftSrc("");
      setDraftAlt("");
      setEditing(true);
      isNew.current = true;
    }
  }, [src]);

  const displayWidth = dragWidth != null ? dragWidth : (width ? width : null);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(true);
  }

  function handleDoubleClick(e) {
    e.preventDefault();
    setEditing(true);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const uid = auth.currentUser?.uid || "anon";
    const path = `content-images/${uid}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    setUploadProgress(0);
    task.on(
      "state_changed",
      snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => setUploadProgress(null),
      async () => {
        const url = await getDownloadURL(storageRef);
        setDraftSrc(url);
        setUploadProgress(null);
        if (!draftAlt) setDraftAlt(file.name.replace(/\.[^.]+$/, ""));
      }
    );
  }

  function save() {
    if (!draftSrc) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) { node.setSrc(draftSrc); node.setAlt(draftAlt); }
    });
    isNew.current = false;
    setEditing(false);
  }

  function cancel() {
    if (isNew.current) {
      editor.update(() => { const n = $getNodeByKey(nodeKey); if (n) n.remove(); });
    } else {
      setDraftSrc(src || "");
      setDraftAlt(alt || "");
      setEditing(false);
    }
    setUploadProgress(null);
  }

  const startResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = imgRef.current?.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startWidth: rect?.width ?? 300 };

    function onMove(mv) {
      const newW = Math.max(50, dragRef.current.startWidth + (mv.clientX - dragRef.current.startX));
      setDragWidth(newW);
    }
    function onUp(up) {
      const newW = Math.max(50, dragRef.current.startWidth + (up.clientX - dragRef.current.startX));
      setDragWidth(null);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) node.setWidth(Math.round(newW));
      });
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [editor, nodeKey]);

  const handle = {
    position: "absolute",
    width: 8, height: 8,
    borderRadius: 2,
    background: "var(--mantine-color-cyan-6)",
    border: "1.5px solid #fff",
    zIndex: 10,
  };

  return (
    <Popover
      opened={editing}
      onClose={cancel}
      position="bottom-start"
      withArrow
      withinPortal
      shadow="md"
      width={300}
      trapFocus
    >
      <Popover.Target>
        <span
          style={{
            display: "inline-block",
            position: "relative",
            maxWidth: "100%",
            outline: isSelected ? "2px solid var(--mantine-color-cyan-5)" : "2px solid transparent",
            outlineOffset: 2,
            borderRadius: 4,
            cursor: "default",
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {src
            ? <img
                ref={imgRef}
                src={src}
                alt={alt}
                draggable={false}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  userSelect: "none",
                  ...(displayWidth ? { width: displayWidth } : { width: "100%" }),
                }}
              />
            : <Box
                component="span"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px",
                  border: "1.5px dashed var(--mantine-color-gray-4)",
                  borderRadius: 6,
                  color: "var(--mantine-color-dimmed)",
                  fontSize: 13, minWidth: 140,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                Set image URL…
              </Box>
          }

          {/* Resize handles — only when selected and image is loaded */}
          {isSelected && src && (
            <>
              <div style={{ ...handle, right: -4, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" }} onMouseDown={startResize} />
              <div style={{ ...handle, right: -4, bottom: -4, cursor: "se-resize" }} onMouseDown={startResize} />
            </>
          )}
        </span>
      </Popover.Target>

      <Popover.Dropdown onMouseDown={e => e.stopPropagation()}>
        <Stack gap="xs">
          {/* Upload from device */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Button
            size="xs"
            variant="light"
            color="cyan"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress !== null}
          >
            {uploadProgress === null ? "Upload from device" : `Uploading…`}
          </Button>
          {uploadProgress !== null && (
            <Progress value={uploadProgress} size="xs" color="cyan" animated />
          )}

          <Divider label="or paste a URL" labelPosition="center" />

          <TextInput
            label="Image URL"
            placeholder="https://example.com/image.png"
            size="xs"
            value={draftSrc}
            onChange={e => setDraftSrc(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            {...(!src && uploadProgress === null ? { "data-autofocus": true } : {})}
          />
          <TextInput label="Alt text" placeholder="Describe the image" size="xs"
            value={draftAlt} onChange={e => setDraftAlt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()} />
          <Group justify="flex-end" gap="xs">
            <Button size="xs" variant="subtle" color="gray" onClick={cancel}>
              {isNew.current ? "Remove" : "Cancel"}
            </Button>
            <Button size="xs" onClick={save} disabled={!draftSrc || uploadProgress !== null}>Save</Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

// ── ImageDisplay — routes between view and edit mode ──────────────────────────
function ImageDisplay({ src, alt, width, nodeKey }) {
  const [editor] = useLexicalComposerContext();

  if (!editor.isEditable()) {
    if (!src) return null;
    return (
      <img
        src={src} alt={alt}
        style={{ display: "block", maxWidth: "100%", ...(width ? { width } : {}) }}
      />
    );
  }

  return <EditableImage src={src} alt={alt} width={width} nodeKey={nodeKey} editor={editor} />;
}

// ── ImageNode ─────────────────────────────────────────────────────────────────
export class ImageNode extends DecoratorNode {
  __src; __alt; __width;

  constructor({ src, alt, width }, key) {
    super(key);
    this.__src   = src   || "";
    this.__alt   = alt   || "";
    this.__width = width || null;
  }

  static getType() { return "image"; }

  static clone(node) {
    return new ImageNode({ src: node.__src, alt: node.__alt, width: node.__width }, node.__key);
  }

  createDOM() {
    const span = document.createElement("span");
    span.style.display = "block";
    return span;
  }

  updateDOM() { return false; }

  setSrc(src)     { this.getWritable().__src   = src;   }
  setAlt(alt)     { this.getWritable().__alt   = alt;   }
  setWidth(width) { this.getWritable().__width = width; }

  decorate() {
    return <ImageDisplay src={this.__src} alt={this.__alt} width={this.__width} nodeKey={this.getKey()} />;
  }

  static importJSON(serialized) {
    return new ImageNode(serialized.data || {});
  }

  exportJSON() {
    return { type: "image", version: 1, data: { src: this.__src, alt: this.__alt, width: this.__width } };
  }
}

export function $createImageNode({ src = "", alt = "", width = null } = {}) {
  return new ImageNode({ src, alt, width });
}
