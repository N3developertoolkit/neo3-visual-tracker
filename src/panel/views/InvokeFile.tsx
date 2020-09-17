import React from "react";

import Dialog from "../components/Dialog";
import InvocationConnection from "../components/contracts/InvocationConnection";
import InvocationStep from "../components/contracts/InvocationStep";
import InvokeFileViewRequest from "../../shared/messages/invokeFileViewRequest";
import InvokeFileViewState from "../../shared/viewState/invokeFileViewState";

type Props = {
  viewState: InvokeFileViewState;
  postMessage: (message: InvokeFileViewRequest) => void;
};

export default function InvokeFile({ viewState, postMessage }: Props) {
  if (!!viewState.errorText) {
    return (
      <Dialog onClose={() => postMessage({ dismissError: true })}>
        {viewState.errorText}
      </Dialog>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "stretch",
        height: "100%",
        maxHeight: "100%",
        borderTop: "1px solid var(--vscode-panel-border)",
      }}
    >
      <div
        style={{
          flex: "2 0",
          overflow: "auto",
          backgroundColor: "var(--vscode-editor-background)",
          color: "var(--vscode-editor-foreground)",
          padding: 10,
        }}
      >
        {viewState.fileContents.map((_, i) => (
          <InvocationStep
            contract={_.contract}
            operation={_.operation}
            args={_.args}
            contracts={viewState.contracts}
            nefHints={viewState.nefHints}
            onUpdate={(contract, operation, args) =>
              postMessage({
                update: { i, contract, operation, args },
              })
            }
          />
        ))}
      </div>
      <div
        style={{
          flex: "1 1",
          overflow: "auto",
          borderLeft: "1px solid var(--vscode-panel-border)",
          padding: 10,
        }}
      >
        <InvocationConnection
          connectedTo={viewState.connectedTo}
          connectionState={viewState.connectionState}
          initiateConnection={() => postMessage({ initiateConnection: true })}
          disconnect={() => postMessage({ disconnect: true })}
        />
      </div>
    </div>
  );
}
