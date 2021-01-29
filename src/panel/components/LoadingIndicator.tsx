import React from "react";

export default function LoadingIndicator() {
  // TODO: Replace with a spinner (the word "loading" does not make sense in all contexts,
  // e.g. when awaiting user input in the extension process)
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        margin: 10,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 30,
        paddingRight: 30,
        backgroundColor: "var(--vscode-statusBar-background)",
        color: "var(--vscode-statusBar-foreground)",
        fontWeight: "bold",
        zIndex: 10000,
      }}
    >
      LOADING&hellip;
    </div>
  );
}
