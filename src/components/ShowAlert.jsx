import React from "react";
import { createRoot } from "react-dom/client";
import { notifications } from "@mantine/notifications";
import { MantineProvider, Modal, Button, Text, Stack } from "@mantine/core";
import theme from "../theme.js";

/**
 * showAlert — backward-compatible alert function.
 *
 * For simple string messages → Mantine notification (non-blocking toast).
 * For JSX children → Mantine Modal (blocking dialog, resolves on close).
 */
export default function showAlert(message, children = null) {
  // Simple string message → toast notification
  if (!children && typeof message === "string") {
    notifications.show({
      message,
      color: "cyan",
      autoClose: 4000,
      withBorder: true,
    });
    return Promise.resolve();
  }

  // JSX content or complex message → modal dialog
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    function handleClose() {
      root.unmount();
      container.remove();
      resolve();
    }

    const content = children || <Text>{message}</Text>;

    root.render(
      <MantineProvider theme={theme}>
        <Modal
          opened={true}
          onClose={handleClose}
          centered
          withCloseButton={false}
          radius="md"
          padding="xl"
          overlayProps={{ backgroundOpacity: 0.5, blur: 3 }}
        >
          <Stack align="center" gap="md">
            {typeof content === 'string' ? <Text>{content}</Text> : content}
            <Button onClick={handleClose} variant="light" color="cyan">
              OK
            </Button>
          </Stack>
        </Modal>
      </MantineProvider>
    );
  });
}
