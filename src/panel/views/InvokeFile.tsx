import React, { useState } from "react";

import Dialog from "../components/Dialog";
import DropTarget from "../components/DropTarget";
import InvocationStep from "../components/contracts/InvocationStep";
import InvokeFileViewRequest from "../../shared/messages/invokeFileViewRequest";
import InvokeFileViewState from "../../shared/viewState/invokeFileViewState";
import NavButton from "../components/NavButton";
import TransactionList from "../components/contracts/TransactionList";

type Props = {
  viewState: InvokeFileViewState;
  postMessage: (message: InvokeFileViewRequest) => void;
};

export default function InvokeFile({ viewState, postMessage }: Props) {
  const [dragActive, setDragActive] = useState(false);
  if (!!viewState.errorText) {
    return (
      <Dialog onClose={() => postMessage({ dismissError: true })}>
        {viewState.errorText}
      </Dialog>
    );
  }
  const argumentSuggestionListId = `list_${Math.random()}`;
  const moveStep = (from: number, to: number) =>
    postMessage({ moveStep: { from, to } });
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
        {Object.keys(viewState.autoCompleteData.wellKnownAddresses).map(
          (addressName) => (
            <option key={`name_${addressName}`} value={`@${addressName}`} />
          )
        )}
        {Object.values(viewState.autoCompleteData.wellKnownAddresses).map(
          (address) => (
            <option key={`adr1_${address}`} value={`@${address}`} />
          )
        )}
        {Object.keys(viewState.autoCompleteData.addressNames).map((address) => (
          <option key={`adr2_${address}`} value={`@${address}`} />
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
          <>
            <DropTarget i={i} onDrop={moveStep} dragActive={dragActive} />
            <InvocationStep
              i={i}
              key={JSON.stringify(_)}
              contract={_.contract}
              operation={_.operation}
              args={_.args}
              autoCompleteData={viewState.autoCompleteData}
              argumentSuggestionListId={argumentSuggestionListId}
              onDragStart={() => setDragActive(true)}
              onDragEnd={() => setDragActive(false)}
              onDelete={() => postMessage({ deleteStep: { i } })}
              onUpdate={(contract, operation, args) =>
                postMessage({
                  update: { i, contract, operation, args },
                })
              }
            />
          </>
        ))}
        <DropTarget
          i={viewState.fileContents.length}
          onDrop={moveStep}
          dragActive={dragActive}
        />
        <div style={{ textAlign: "center" }}>
          <NavButton onClick={() => postMessage({ addStep: true })}>
            Add step
          </NavButton>{" "}
          <NavButton onClick={() => postMessage({ runAll: true })}>
            Run all steps
          </NavButton>
        </div>
      </div>
      <div
        style={{
          flex: "1 1",
          overflow: "auto",
          borderLeft: "1px solid var(--vscode-panel-border)",
          padding: 10,
        }}
      >
        <TransactionList transactions={viewState.recentTransactions} />
      </div>
    </div>
  );
}
