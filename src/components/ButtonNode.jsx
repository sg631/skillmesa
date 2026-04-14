import { DecoratorNode, $getNodeByKey } from "lexical";
import React, { useState, useRef, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { Popover, Stack, TextInput, Group, Button } from "@mantine/core";

const buttonStyle = {
  display: "inline-block",
  padding: "8px 18px",
  borderRadius: 8,
  background: "var(--mantine-color-cyan-6)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
  cursor: "pointer",
  userSelect: "none",
};

// ── EditableButton — selection + inline popover ───────────────────────────────
function EditableButton({ label, href, nodeKey, editor }) {
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [editing, setEditing] = useState(!label);
  const [draftLabel, setDraftLabel] = useState(label || "");
  const [draftHref, setDraftHref] = useState(href || "");
  const isNew = useRef(!label);

  useEffect(() => {
    if (!label) {
      setDraftLabel(""); setDraftHref("");
      setEditing(true); isNew.current = true;
    }
  }, [label]);

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
    if (!draftLabel) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) { node.setLabel(draftLabel); node.setHref(draftHref); }
    });
    isNew.current = false;
    setEditing(false);
  }

  function cancel() {
    if (isNew.current) {
      editor.update(() => { const n = $getNodeByKey(nodeKey); if (n) n.remove(); });
    } else {
      setDraftLabel(label || ""); setDraftHref(href || "");
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
      width={280}
      trapFocus
    >
      <Popover.Target>
        <span
          style={{
            ...buttonStyle,
            outline: isSelected ? "2px solid var(--mantine-color-cyan-3)" : "none",
            outlineOffset: 2,
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {label || "Button"}
        </span>
      </Popover.Target>

      <Popover.Dropdown onMouseDown={e => e.stopPropagation()}>
        <Stack gap="xs">
          <TextInput label="Label" placeholder="Click here" size="xs"
            value={draftLabel} onChange={e => setDraftLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()} data-autofocus />
          <TextInput label="Link URL (optional)" placeholder="https://example.com" size="xs"
            value={draftHref} onChange={e => setDraftHref(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()} />
          <Group justify="flex-end" gap="xs">
            <Button size="xs" variant="subtle" color="gray" onClick={cancel}>
              {isNew.current ? "Remove" : "Cancel"}
            </Button>
            <Button size="xs" onClick={save} disabled={!draftLabel}>Save</Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

// ── ButtonDisplay — routes between view and edit mode ─────────────────────────
function ButtonDisplay({ label, href, nodeKey }) {
  const [editor] = useLexicalComposerContext();

  if (!editor.isEditable()) {
    if (href) {
      return <a href={href} target="_blank" rel="noopener noreferrer" style={buttonStyle}>{label || "Button"}</a>;
    }
    return <span style={buttonStyle}>{label || "Button"}</span>;
  }

  return <EditableButton label={label} href={href} nodeKey={nodeKey} editor={editor} />;
}

// ── ButtonNode ────────────────────────────────────────────────────────────────
export class ButtonNode extends DecoratorNode {
  __label; __href;

  constructor(label, href, key) {
    super(key);
    this.__label = label || "";
    this.__href  = href  || "";
  }

  static getType() { return "button"; }

  static clone(node) {
    return new ButtonNode(node.__label, node.__href, node.__key);
  }

  createDOM() {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    return span;
  }

  updateDOM() { return false; }

  setLabel(label) { this.getWritable().__label = label; }
  setHref(href)   { this.getWritable().__href  = href;  }

  decorate() {
    return <ButtonDisplay label={this.__label} href={this.__href} nodeKey={this.getKey()} />;
  }

  static importJSON(serialized) {
    const { label, href } = serialized.data || {};
    return new ButtonNode(label, href);
  }

  exportJSON() {
    return { type: "button", version: 1, data: { label: this.__label, href: this.__href } };
  }
}

export function $createButtonNode(label = "", href = "") {
  return new ButtonNode(label, href);
}
