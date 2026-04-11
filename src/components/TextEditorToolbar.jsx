import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
} from "lexical";
import {
  TOGGLE_LINK_COMMAND,
  $isLinkNode,
} from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { Group, ActionIcon, Tooltip, Modal, TextInput, Button, Stack, Text, Select, Divider } from "@mantine/core";
import { Bold, Italic, Underline, List, ListOrdered, Link2, Image, MousePointerClick, FileText } from "lucide-react";
import { $createImageNode } from "./ImageNode.jsx";
import { $createButtonNode } from "./ButtonNode.jsx";
import { $createFileRefNode } from "./FileRefNode.jsx";

// Passed from TextEditor — list of available files for file-ref picker
export default function TextEditorToolbar({ listingFiles = [] }) {
  const [editor] = useLexicalComposerContext();

  // Link modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [confirmLink, setConfirmLink] = useState(null);

  // Image modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  // Button modal
  const [buttonModalOpen, setButtonModalOpen] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonHref, setButtonHref] = useState("");

  // File ref modal
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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
    if (linkUrl) editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
    setLinkModalOpen(false);
    setLinkUrl("");
  };

  const handleImageSubmit = () => {
    if (!imageUrl) return;
    editor.update(() => {
      const node = $createImageNode({ src: imageUrl, alt: imageAlt });
      $insertNodes([node]);
    });
    setImageModalOpen(false);
    setImageUrl("");
    setImageAlt("");
  };

  const handleButtonSubmit = () => {
    if (!buttonLabel) return;
    editor.update(() => {
      const node = $createButtonNode(buttonLabel, buttonHref);
      $insertNodes([node]);
    });
    setButtonModalOpen(false);
    setButtonLabel("");
    setButtonHref("");
  };

  const handleFileRefSubmit = () => {
    if (!selectedFile) return;
    const file = listingFiles.find(f => f.id === selectedFile);
    if (!file) return;
    editor.update(() => {
      const node = $createFileRefNode(file.name, file.url || file.downloadUrl || "", file.privacy || "public");
      $insertNodes([node]);
    });
    setFileModalOpen(false);
    setSelectedFile(null);
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
      <Group gap={4} p={6} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', background: 'var(--mantine-color-default)', borderRadius: '8px 8px 0 0', flexWrap: 'wrap' }}>
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
        <Tooltip label="Insert Image">
          <ActionIcon variant="subtle" color="gray" onClick={() => { setImageUrl(""); setImageAlt(""); setImageModalOpen(true); }}>
            <Image size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Insert Button">
          <ActionIcon variant="subtle" color="gray" onClick={() => { setButtonLabel(""); setButtonHref(""); setButtonModalOpen(true); }}>
            <MousePointerClick size={16} />
          </ActionIcon>
        </Tooltip>
        {listingFiles.length > 0 && (
          <Tooltip label="Reference a File">
            <ActionIcon variant="subtle" color="gray" onClick={() => { setSelectedFile(null); setFileModalOpen(true); }}>
              <FileText size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* Link URL Modal */}
      <Modal opened={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Insert Link" centered size="sm">
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
            <Button onClick={handleLinkSubmit}>Insert</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Open Link Confirmation Modal */}
      <Modal opened={!!confirmLink} onClose={() => setConfirmLink(null)} title="Open Link" centered size="sm">
        <Stack gap="sm">
          <Text size="sm">Open this link in a new tab?</Text>
          <Text size="sm" c="cyan" style={{ wordBreak: 'break-all' }}>{confirmLink}</Text>
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={() => setConfirmLink(null)}>Cancel</Button>
            <Button onClick={() => { window.open(confirmLink, "_blank"); setConfirmLink(null); }}>Open</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Image Modal */}
      <Modal opened={imageModalOpen} onClose={() => setImageModalOpen(false)} title="Insert Image" centered size="sm">
        <Stack gap="sm">
          <TextInput
            label="Image URL"
            placeholder="https://example.com/image.png"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            data-autofocus
          />
          <TextInput
            label="Alt text (optional)"
            placeholder="Describe the image"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
          />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={() => setImageModalOpen(false)}>Cancel</Button>
            <Button onClick={handleImageSubmit} disabled={!imageUrl}>Insert</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Button Modal */}
      <Modal opened={buttonModalOpen} onClose={() => setButtonModalOpen(false)} title="Insert Button" centered size="sm">
        <Stack gap="sm">
          <TextInput
            label="Button label"
            placeholder="Click here"
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
            data-autofocus
          />
          <TextInput
            label="Link URL (optional)"
            placeholder="https://example.com"
            value={buttonHref}
            onChange={(e) => setButtonHref(e.target.value)}
          />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={() => setButtonModalOpen(false)}>Cancel</Button>
            <Button onClick={handleButtonSubmit} disabled={!buttonLabel}>Insert</Button>
          </Group>
        </Stack>
      </Modal>

      {/* File Reference Modal */}
      <Modal opened={fileModalOpen} onClose={() => setFileModalOpen(false)} title="Reference a File" centered size="sm">
        <Stack gap="sm">
          <Select
            label="Choose file"
            placeholder="Select a file"
            data={listingFiles.map(f => ({ value: f.id, label: f.name }))}
            value={selectedFile}
            onChange={setSelectedFile}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={() => setFileModalOpen(false)}>Cancel</Button>
            <Button onClick={handleFileRefSubmit} disabled={!selectedFile}>Insert</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
