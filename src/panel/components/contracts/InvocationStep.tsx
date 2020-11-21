import React from "react";
import { ContractMethodDefinitionJson } from "@cityofzion/neon-core/lib/sc";

import ArgumentsInput from "./ArgumentsInput";
import AutoCompleteData from "../../../shared/autoCompleteData";
import ContractInput from "./ContractInput";
import OperationInput from "./OperationInput";
import NavButton from "../NavButton";

type Props = {
  i: number;
  contract?: string;
  operation?: string;
  args?: (string | number)[];
  autoCompleteData: AutoCompleteData;
  argumentSuggestionListId: string;
  forceFocus?: boolean;
  isPartOfDiffView: boolean;
  isReadOnly: boolean;
  onDelete: () => void;
  onRun: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onUpdate: (
    contract?: string,
    operation?: string,
    args?: (string | number)[]
  ) => void;
};

export default function InvocationStep({
  i,
  contract,
  operation,
  args,
  autoCompleteData,
  argumentSuggestionListId,
  forceFocus,
  isPartOfDiffView,
  isReadOnly,
  onDelete,
  onRun,
  onDragStart,
  onDragEnd,
  onUpdate,
}: Props) {
  let operations: ContractMethodDefinitionJson[] = [];
  if (contract) {
    const contractHash = autoCompleteData.contractHashes[contract] || contract;
    const manifest = autoCompleteData.contractManifests[contractHash];
    if (manifest?.abi) {
      operations = manifest.abi.methods;
    }
  }
  return (
    <div
      draggable={!isReadOnly}
      onDragStart={
        isReadOnly
          ? undefined
          : (e) => {
              e.dataTransfer.setData("InvocationStep", `${i}`);
              onDragStart();
            }
      }
      onDragEnd={isReadOnly ? undefined : onDragEnd}
      style={{
        backgroundColor: "var(--vscode-editorWidget-background)",
        color: "var(--vscode-editorWidget-foreground)",
        border: "var(--vscode-editorWidget-border)",
        borderRadius: 10,
        marginLeft: 10,
        marginRight: 10,
        padding: 15,
        cursor: isReadOnly ? undefined : "move",
      }}
    >
      <ContractInput
        autoCompleteData={autoCompleteData}
        contract={contract}
        forceFocus={forceFocus}
        isPartOfDiffView={isPartOfDiffView}
        isReadOnly={isReadOnly}
        style={{ marginBottom: 10 }}
        setContract={(newContract: string) =>
          onUpdate(newContract, operation, args)
        }
      />
      <OperationInput
        isReadOnly={isReadOnly}
        operations={operations}
        operation={operation}
        style={{ marginBottom: 10 }}
        setOperation={(newOperation: string) =>
          onUpdate(contract, newOperation, args)
        }
      />
      <ArgumentsInput
        args={args || []}
        autoSuggestListId={argumentSuggestionListId}
        isReadOnly={isReadOnly}
        parameterDefinitions={
          operations.find((_) => _.name === operation)?.parameters
        }
        style={{ marginBottom: 10 }}
        setArguments={(newArguments: (string | number)[]) =>
          onUpdate(contract, operation, newArguments)
        }
      />
      {(!isReadOnly || isPartOfDiffView) && (
        <div style={{ textAlign: "right" }}>
          <NavButton
            onClick={onDelete}
            disabled={isReadOnly}
            style={{
              visibility: isPartOfDiffView && isReadOnly ? "hidden" : undefined,
            }}
          >
            Delete this step
          </NavButton>{" "}
          {!isPartOfDiffView && (
            <NavButton onClick={onRun} disabled={isReadOnly}>
              Run this step
            </NavButton>
          )}
        </div>
      )}
    </div>
  );
}
