import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  $createTextNode,
} from "lexical";
import {
  TOGGLE_LINK_COMMAND,
  $isLinkNode,
  $createLinkNode,
} from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
  Group, ActionIcon, Tooltip, Popover, TextInput, Button, Stack,
} from "@mantine/core";
import { Bold, Italic, Underline, List, ListOrdered, Link2, Image, MousePointerClick, FileText } from "lucide-react";
import { $createImageNode } from "./ImageNode.jsx";
import { $createButtonNode } from "./ButtonNode.jsx";
import { $createFileRefNode } from "./FileRefNode.jsx";

export default function TextEditorToolbar({ listingFiles = [] }) {
  const [editor] = useLexicalComposerContext();

  // Link popover state
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkHasSelection, setLinkHasSelection] = useState(false);

  const handleLinkClick = () => {
    let isInLink = false;
    let hasSelection = false;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        hasSelection = !selection.isCollapsed();
        const node = selection.anchor.getNode();
        isInLink = $isLinkNode(node.getParent());
      }
    });

    // Toggle off if cursor is already inside a link
    if (isInLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }

    setLinkHasSelection(hasSelection);
    setLinkUrl("");
    setLinkText("");
    setLinkPopoverOpen(true);
  };

  const handleLinkSubmit = () => {
    if (!linkUrl) return;

    if (linkHasSelection) {
      // Wrap selected text in a link
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
    } else {
      // Insert a new link node with custom text at the cursor position
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const linkNode = $createLinkNode(linkUrl);
          linkNode.append($createTextNode(linkText.trim() || linkUrl));
          selection.insertNodes([linkNode]);
        }
      });
    }

    setLinkUrl("");
    setLinkText("");
    setLinkPopoverOpen(false);
  };

  // Image: insert immediately with empty src → node auto-opens its popover
  const handleInsertImage  = () => editor.update(() => { $insertNodes([$createImageNode()]); });
  // Button: insert immediately with empty label → node auto-opens its popover
  const handleInsertButton = () => editor.update(() => { $insertNodes([$createButtonNode()]); });
  // FileRef: insert immediately → node auto-opens its popover
  const handleInsertFileRef = () => editor.update(() => { $insertNodes([$createFileRefNode()]); });

  // Ctrl+click on a link in the editor → open in new tab directly
  React.useEffect(() => {
    const container = document.querySelector(".editor-input");
    if (!container) return;
    const handleClick = (e) => {
      const link = e.target.closest("a");
      if (link && e.ctrlKey) {
        e.preventDefault();
        window.open(link.href, "_blank", "noopener,noreferrer");
      }
    };
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  return (
    <Group gap={4} p={6} style={{
      borderBottom: "1px solid var(--mantine-color-gray-3)",
      background: "var(--mantine-color-default)",
      borderRadius: "8px 8px 0 0",
      flexWrap: "wrap",
    }}>
      <Tooltip label="Bold">
        <ActionIcon variant="subtle" color="gray" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
          <Bold size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Italic">
        <ActionIcon variant="subtle" color="gray" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
          <Italic size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Underline">
        <ActionIcon variant="subtle" color="gray" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>
          <Underline size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Bullet List">
        <ActionIcon variant="subtle" color="gray" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND)}>
          <List size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Numbered List">
        <ActionIcon variant="subtle" color="gray" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND)}>
          <ListOrdered size={16} />
        </ActionIcon>
      </Tooltip>

      {/* Link — Popover on the toolbar button; adapts to selection state */}
      <Popover
        opened={linkPopoverOpen}
        onChange={setLinkPopoverOpen}
        position="bottom-start"
        withArrow
        withinPortal
        shadow="md"
        width={280}
        trapFocus
      >
        <Popover.Target>
          <Tooltip label="Insert Link">
            <ActionIcon variant="subtle" color="gray" onClick={handleLinkClick}>
              <Link2 size={16} />
            </ActionIcon>
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown onMouseDown={e => e.stopPropagation()}>
          <Stack gap="xs">
            {/* Text field only shown when nothing is selected (inserting a new link) */}
            {!linkHasSelection && (
              <TextInput
                label="Text"
                placeholder="Link text"
                size="xs"
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLinkSubmit()}
                data-autofocus
              />
            )}
            <TextInput
              label="URL"
              placeholder="https://example.com"
              size="xs"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLinkSubmit()}
              {...(linkHasSelection ? { "data-autofocus": true } : {})}
            />
            <Group justify="flex-end" gap="xs">
              <Button size="xs" variant="subtle" color="gray" onClick={() => setLinkPopoverOpen(false)}>Cancel</Button>
              <Button size="xs" onClick={handleLinkSubmit} disabled={!linkUrl}>
                {linkHasSelection ? "Apply" : "Insert"}
              </Button>
            </Group>
          </Stack>
        </Popover.Dropdown>
      </Popover>

      <Tooltip label="Insert Image">
        <ActionIcon variant="subtle" color="gray" onClick={handleInsertImage}>
          <Image size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Insert Button">
        <ActionIcon variant="subtle" color="gray" onClick={handleInsertButton}>
          <MousePointerClick size={16} />
        </ActionIcon>
      </Tooltip>

      {listingFiles.length > 0 && (
        <Tooltip label="Reference a File">
          <ActionIcon variant="subtle" color="gray" onClick={handleInsertFileRef}>
            <FileText size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
