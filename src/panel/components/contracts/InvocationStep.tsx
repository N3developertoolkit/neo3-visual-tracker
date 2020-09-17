import React from "react";
import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import ContractInput from "./ContractInput";

type Props = {
  contract?: string;
  operation?: string;
  args?: (string | number)[];
  baseHref: string;
  contracts: { [hashOrNefFile: string]: ContractManifestJson };
  nefHints: { [hash: string]: string };
};

export default function InvocationStep({
  contract,
  operation,
  args,
  baseHref,
  contracts,
  nefHints,
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
        baseHref={baseHref}
        contracts={contracts}
        nefHints={nefHints}
        setContract={() => {}}
      />
      <div>{operation}</div>
      <div>{args}</div>
    </div>
  );
}
