import React from "react";
import { ContractMethodDefinitionJson } from "@cityofzion/neon-core/lib/sc";

import ArgumentsInput from "./ArgumentsInput";
import AutoCompleteData from "../../../shared/autoCompleteData";
import ContractInput from "./ContractInput";
import OperationInput from "./OperationInput";

type Props = {
  contract?: string;
  operation?: string;
  args?: (string | number)[];
  autoCompleteData: AutoCompleteData;
  argumentSuggestionListId: string;
  onUpdate: (
    contract?: string,
    operation?: string,
    args?: (string | number)[]
  ) => void;
};

export default function InvocationStep({
  contract,
  operation,
  args,
  autoCompleteData,
  argumentSuggestionListId,
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
      style={{
        backgroundColor: "var(--vscode-editorWidget-background)",
        color: "var(--vscode-editorWidget-foreground)",
        border: "var(--vscode-editorWidget-border)",
        margin: 10,
        padding: 10,
      }}
    >
      <ContractInput
        style={{ marginBottom: 10 }}
        contract={contract}
        autoCompleteData={autoCompleteData}
        setContract={(newContract: string) =>
          onUpdate(newContract, operation, args)
        }
      />
      <OperationInput
        style={{ marginBottom: 10 }}
        operations={operations}
        operation={operation}
        setOperation={(newOperation: string) =>
          onUpdate(contract, newOperation, args)
        }
      />
      <ArgumentsInput
        style={{ marginBottom: 10 }}
        parameterDefinitions={
          operations.find((_) => _.name === operation)?.parameters || []
        }
        args={args || []}
        autoSuggestListId={argumentSuggestionListId}
        setArguments={(newArguments: (string | number)[]) =>
          onUpdate(contract, operation, newArguments)
        }
      />
    </div>
  );
}
