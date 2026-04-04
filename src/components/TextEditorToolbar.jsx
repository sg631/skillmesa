import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import {
  TOGGLE_LINK_COMMAND,
  $isLinkNode,
} from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { Group, ActionIcon, Tooltip, Modal, TextInput, Button, Stack, Text } from "@mantine/core";
import { Bold, Italic, Underline, List, ListOrdered, Link2 } from "lucide-react";

export default function TextEditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [confirmLink, setConfirmLink] = useState(null);

  const handleLinkClick = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const node = selection.anchor.getNode();
      const isLink = $isLinkNode(node.getParent());

      if (isLink) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      } else {
        setLinkUrl("");
        setLinkModalOpen(true);
      }
    });
  };

  const handleLinkSubmit = () => {
    if (linkUrl) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
    }
    setLinkModalOpen(false);
    setLinkUrl("");
  };

  React.useEffect(() => {
    const container = document.querySelector(".editor-input");
    if (!container) return;

    const handleClick = (e) => {
      const link = e.target.closest("a");
      if (link && e.ctrlKey) {
        e.preventDefault();
        setConfirmLink(link.href);
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <Group gap={4} p={6} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', background: 'var(--mantine-color-gray-0)', borderRadius: '8px 8px 0 0' }}>
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
        <Tooltip label="Insert Link">
          <ActionIcon variant="subtle" color="gray" onClick={handleLinkClick}>
            <Link2 size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Link URL Modal */}
      <Modal
        opened={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Insert Link"
        centered
        size="sm"
      >
        <Stack gap="sm">
          <TextInput
            placeholder="https://example.com"
            label="URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={() => setLinkModalOpen(false)}>Cancel</Button>
            <Button color="cyan" onClick={handleLinkSubmit}>Insert</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Open Link Confirmation Modal */}
      <Modal
        opened={!!confirmLink}
        onClose={() => setConfirmLink(null)}
        title="Open Link"
        centered
        size="sm"
      >
        <Stack gap="sm">
          <Text size="sm">Open this link in a new tab?</Text>
          <Text size="sm" c="cyan" style={{ wordBreak: 'break-all' }}>{confirmLink}</Text>
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={() => setConfirmLink(null)}>Cancel</Button>
            <Button color="cyan" onClick={() => { window.open(confirmLink, "_blank"); setConfirmLink(null); }}>Open</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
