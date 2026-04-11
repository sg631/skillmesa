import { DecoratorNode } from "lexical";
import React, { useState } from "react";
import FilePreviewModal from "./FilePreviewModal.jsx";

// ── FileRefDisplay: a real React component so it can use hooks ────────
function FileRefDisplay({ fileName, fileUrl, privacy }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const isLocked = privacy === "enroll" || privacy === "managers";

  const containerStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--mantine-color-gray-3)",
    background: "var(--mantine-color-default)",
    fontSize: 13,
    color: "inherit",
    textDecoration: "none",
    cursor: "pointer",
    maxWidth: "100%",
    userSelect: "none",
  };

  const file = fileUrl ? { name: fileName, url: fileUrl } : null;

  function handleClick(e) {
    e.preventDefault();
    if (fileUrl) setPreviewOpen(true);
  }

  return (
    <>
      <span style={containerStyle} onClick={handleClick} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleClick(e)}>
        <FileDocIcon />
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fileName}
        </span>
        {isLocked ? <LockIcon /> : <GlobeIcon />}
      </span>
      {file && (
        <FilePreviewModal file={previewOpen ? file : null} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  );
}

// Inline SVGs to avoid external import issues inside Lexical decorators
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

// ── Lexical node ──────────────────────────────────────────────────────
export class FileRefNode extends DecoratorNode {
  __fileName;
  __fileUrl;
  __privacy;

  constructor(fileName, fileUrl, privacy, key) {
    super(key);
    this.__fileName = fileName || "File";
    this.__fileUrl = fileUrl || "";
    this.__privacy = privacy || "public";
  }

  static getType() { return "fileref"; }

  static clone(node) {
    return new FileRefNode(node.__fileName, node.__fileUrl, node.__privacy, node.__key);
  }

  createDOM() {
    const span = document.createElement("span");
    return span;
  }

  updateDOM() { return false; }

  decorate() {
    return (
      <FileRefDisplay
        fileName={this.__fileName}
        fileUrl={this.__fileUrl}
        privacy={this.__privacy}
      />
    );
  }

  static importJSON(serialized) {
    const { fileName, fileUrl, privacy } = serialized.data || {};
    return new FileRefNode(fileName, fileUrl, privacy);
  }

  exportJSON() {
    return {
      type: "fileref",
      version: 1,
      data: { fileName: this.__fileName, fileUrl: this.__fileUrl, privacy: this.__privacy },
    };
  }
}

export function $createFileRefNode(fileName, fileUrl, privacy) {
  return new FileRefNode(fileName, fileUrl, privacy);
}
