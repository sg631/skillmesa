import { DecoratorNode, $getNodeByKey } from "lexical";
import React, { useState, useRef, useEffect, useContext, lazy, Suspense } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { Popover, Stack, Select, Group, Button } from "@mantine/core";
import { ListingFilesContext, EditorModeContext } from "./EditorContext.js";

const FilePreviewModal = lazy(() => import("./FilePreviewModal.jsx"));

// ── Inline SVGs ───────────────────────────────────────────────────────────────
function FileDocIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

// ── Shared chip display ───────────────────────────────────────────────────────
function FileChip({ fileName, privacy, isSelected, onClick, onDoubleClick }) {
  const isLocked = privacy === "enroll" || privacy === "managers";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 8,
        border: "1px solid var(--mantine-color-gray-3)",
        background: "var(--mantine-color-default)",
        fontSize: 13, color: "inherit", textDecoration: "none",
        cursor: "pointer", maxWidth: "100%", userSelect: "none",
        outline: isSelected ? "2px solid var(--mantine-color-cyan-5)" : "2px solid transparent",
        outlineOffset: 2,
      }}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={e => e.key === "Enter" && onClick?.(e)}
    >
      <FileDocIcon />
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {fileName || "Select a file…"}
      </span>
      {fileName && (isLocked ? <LockIcon /> : <GlobeIcon />)}
    </span>
  );
}

// ── Edit mode: popover for file selection ─────────────────────────────────────
function EditableFileRef({ fileName, fileUrl, mimeType, privacy, nodeKey, listingFiles }) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [editing, setEditing] = useState(!fileName);
  const isNew = useRef(!fileName);

  const currentFile = listingFiles.find(
    f => f.name === fileName || (f.url || f.downloadUrl) === fileUrl
  ) || null;
  const [selectedId, setSelectedId] = useState(currentFile?.id || null);

  useEffect(() => {
    if (!fileName) { setEditing(true); isNew.current = true; }
  }, [fileName]);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(true);
  }

  function handleDoubleClick(e) {
    e.preventDefault();
    setEditing(true);
  }

  function save() {
    if (!selectedId) return;
    const file = listingFiles.find(f => f.id === selectedId);
    if (!file) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.setFileName(file.name);
        node.setFileUrl(file.url || file.downloadUrl || "");
        node.setMimeType(file.mimeType || "");
        node.setPrivacy(file.privacy || "public");
      }
    });
    isNew.current = false;
    setEditing(false);
  }

  function cancel() {
    if (isNew.current) {
      editor.update(() => { const n = $getNodeByKey(nodeKey); if (n) n.remove(); });
    } else {
      setSelectedId(currentFile?.id || null);
      setEditing(false);
    }
  }

  return (
    <Popover
      opened={editing}
      onClose={cancel}
      position="bottom-start"
      withArrow
      withinPortal
      shadow="md"
      width={260}
      trapFocus
    >
      <Popover.Target>
        <span style={{ display: "inline-block" }}>
          <FileChip
            fileName={fileName}
            privacy={privacy}
            isSelected={isSelected}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          />
        </span>
      </Popover.Target>

      <Popover.Dropdown onMouseDown={e => e.stopPropagation()}>
        <Stack gap="xs">
          <Select
            label="File" placeholder="Select a file" size="xs"
            data={listingFiles.map(f => ({ value: f.id, label: f.name }))}
            value={selectedId}
            onChange={setSelectedId}
            data-autofocus
          />
          <Group justify="flex-end" gap="xs">
            <Button size="xs" variant="subtle" color="gray" onClick={cancel}>
              {isNew.current ? "Remove" : "Cancel"}
            </Button>
            <Button size="xs" onClick={save} disabled={!selectedId}>Save</Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

// ── View mode: click opens preview modal ──────────────────────────────────────
function ViewFileRef({ fileName, fileUrl, mimeType, privacy }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const file = fileUrl ? { name: fileName, url: fileUrl, mimeType } : null;

  return (
    <>
      <FileChip
        fileName={fileName}
        privacy={privacy}
        onClick={e => { e.preventDefault(); if (fileUrl) setPreviewOpen(true); }}
      />
      {file && previewOpen && (
        <Suspense fallback={null}>
          <FilePreviewModal file={file} onClose={() => setPreviewOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

// ── FileRefDisplay — routes between edit and view mode ────────────────────────
function FileRefDisplay({ fileName, fileUrl, mimeType, privacy, nodeKey }) {
  const isEditMode   = useContext(EditorModeContext);
  const listingFiles = useContext(ListingFilesContext);

  if (isEditMode) {
    return (
      <EditableFileRef
        fileName={fileName} fileUrl={fileUrl} mimeType={mimeType}
        privacy={privacy} nodeKey={nodeKey} listingFiles={listingFiles}
      />
    );
  }

  return <ViewFileRef fileName={fileName} fileUrl={fileUrl} mimeType={mimeType} privacy={privacy} />;
}

// ── FileRefNode ───────────────────────────────────────────────────────────────
export class FileRefNode extends DecoratorNode {
  __fileName; __fileUrl; __mimeType; __privacy;

  constructor(fileName, fileUrl, mimeType, privacy, key) {
    super(key);
    this.__fileName = fileName || "";
    this.__fileUrl  = fileUrl  || "";
    this.__mimeType = mimeType || "";
    this.__privacy  = privacy  || "public";
  }

  static getType() { return "fileref"; }

  static clone(node) {
    return new FileRefNode(node.__fileName, node.__fileUrl, node.__mimeType, node.__privacy, node.__key);
  }

  createDOM() { return document.createElement("span"); }
  updateDOM() { return false; }

  setFileName(v) { this.getWritable().__fileName = v; }
  setFileUrl(v)  { this.getWritable().__fileUrl  = v; }
  setMimeType(v) { this.getWritable().__mimeType = v; }
  setPrivacy(v)  { this.getWritable().__privacy  = v; }

  decorate() {
    return (
      <FileRefDisplay
        fileName={this.__fileName} fileUrl={this.__fileUrl}
        mimeType={this.__mimeType} privacy={this.__privacy}
        nodeKey={this.getKey()}
      />
    );
  }

  static importJSON(serialized) {
    const { fileName, fileUrl, mimeType, privacy } = serialized.data || {};
    return new FileRefNode(fileName, fileUrl, mimeType, privacy);
  }

  exportJSON() {
    return {
      type: "fileref", version: 1,
      data: { fileName: this.__fileName, fileUrl: this.__fileUrl, mimeType: this.__mimeType, privacy: this.__privacy },
    };
  }
}

export function $createFileRefNode(fileName, fileUrl, mimeType, privacy) {
  return new FileRefNode(fileName, fileUrl, mimeType, privacy);
}
