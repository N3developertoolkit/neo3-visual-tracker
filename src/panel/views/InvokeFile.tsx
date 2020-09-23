import React from "react";

import Dialog from "../components/Dialog";
import InvocationConnection from "../components/contracts/InvocationConnection";
import InvocationStep from "../components/contracts/InvocationStep";
import InvokeFileViewRequest from "../../shared/messages/invokeFileViewRequest";
import InvokeFileViewState from "../../shared/viewState/invokeFileViewState";
import NavButton from "../components/NavButton";

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
  const argumentSuggestionListId = `list_${Math.random()}`;
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
      <datalist id={argumentSuggestionListId}>
        {viewState.addressSuggestions.map((_) => (
          <option key={_} value={`@${_}`} />
        ))}
        {Object.getOwnPropertyNames(viewState.contracts).map((_) => (
          <option key={_} value={`#${_}`} />
        ))}
      </datalist>
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
            key={i}
            contract={_.contract}
            operation={_.operation}
            args={_.args}
            contracts={viewState.contracts}
            nefHints={viewState.nefHints}
            argumentSuggestionListId={argumentSuggestionListId}
            onUpdate={(contract, operation, args) =>
              postMessage({
                update: { i, contract, operation, args },
              })
            }
          />
        ))}
        <InvocationStep
          key={viewState.fileContents.length}
          contracts={viewState.contracts}
          nefHints={viewState.nefHints}
          argumentSuggestionListId={argumentSuggestionListId}
          onUpdate={(contract, operation, args) =>
            postMessage({
              update: {
                i: viewState.fileContents.length,
                contract,
                operation,
                args,
              },
            })
          }
        />
      </div>
      <div
        style={{
          flex: "1 1",
          overflow: "auto",
          borderLeft: "1px solid var(--vscode-panel-border)",
          padding: 10,
        }}
      >
        <div style={{ padding: 10, textAlign: "center" }}>
          <InvocationConnection
            connectedTo={viewState.connectedTo}
            connectionState={viewState.connectionState}
            initiateConnection={() => postMessage({ initiateConnection: true })}
            disconnect={() => postMessage({ disconnect: true })}
          />
        </div>
        <hr />
        <div style={{ padding: 10, textAlign: "center" }}>
          <NavButton
            disabled={viewState.connectionState !== "ok"}
            onClick={() => postMessage({ run: true })}
          >
            Run
          </NavButton>
        </div>
      </div>
    </div>
  );
}
