import React from "react";

import NavButton from "./NavButton";

type Props = {
  children: any;
  onClose: () => void;
};

export default function Dialog({ children, onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        cursor: "pointer",
        display: "flex",
        backgroundColor: "rgba(255,255,255,0.50)",
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          cursor: "default",
          backgroundColor: "var(--vscode-editor-background)",
          color: "var(--vscode-editor-foreground)",
          border: "1px solid var(--vscode-focusBorder)",
          padding: 20,
          maxHeight: "80vh",
          maxWidth: "80vw",
          overflow: "auto",
          minWidth: "40vw",
          minHeight: "40vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>{children}</div>
        <div>
          <NavButton onClick={onClose}>Close</NavButton>
        </div>
      </div>
    </div>
  );
}
