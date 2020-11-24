import React from "react";

import InvokeFileViewRequest from "../../../shared/messages/invokeFileViewRequest";
import InvokeFileViewState from "../../../shared/viewState/invokeFileViewState";

type Props = {
  viewState: InvokeFileViewState;
  postMessage: (message: InvokeFileViewRequest) => void;
};

export default function InvokeFileJsonEditor({ viewState }: Props) {
  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        backgroundColor: "var(--vscode-editor-background)",
        color: "var(--vscode-editor-foreground)",
      }}
    >
      <pre>{viewState.fileContentsJson}</pre>
    </div>
  );
}
