import React from "react";
import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import ContractInput from "./ContractInput";

type Props = {
  contract?: string;
  operation?: string;
  args?: (string | number)[];
  contracts: { [hashOrNefFile: string]: ContractManifestJson };
  nefHints: { [hash: string]: { [nefPath: string]: boolean } };
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
  contracts,
  nefHints,
  onUpdate,
}: Props) {
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
        contract={contract}
        contracts={contracts}
        nefHints={nefHints}
        setContract={(newContract: string) =>
          onUpdate(newContract, operation, args)
        }
      />
      <div>{operation}</div>
      <div>{args}</div>
    </div>
  );
}
