import React from "react";
import { createRoot } from "react-dom/client";

function Alert({ message, children, onClose }) {
  if (!children) children = <p>{message}</p>;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2em",
          borderRadius: "8px",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        {children}
        <button
          style={{ marginTop: "1em", padding: "0.5em 1em" }}
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function showAlert(message, children = null,) {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = createRoot(container);

    function handleClose() {
      root.unmount();
      container.remove();
      resolve();
    }

    root.render(
      <Alert message={message} onClose={handleClose}>
        {children}
      </Alert>
    );
  });
}
