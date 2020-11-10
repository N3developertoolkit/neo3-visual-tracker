import React from "react";

import { ContractMethodDefinitionJson } from "@cityofzion/neon-core/lib/sc";

type Props = {
  operation: ContractMethodDefinitionJson;
  onMouseDown?: (newValue: string) => void;
};

export default function OperatonTile({ operation, onMouseDown }: Props) {
  const style: React.CSSProperties = {
    borderBottom: "1px solid var(--vscode-dropdown-border)",
    backgroundColor: "var(--vscode-dropdown-background)",
    padding: 5,
    cursor: onMouseDown ? "pointer" : undefined,
  };
  return (
    <div
      style={style}
      onMouseDown={() => {
        if (onMouseDown) {
          onMouseDown(operation.name);
        }
      }}
    >
      <div style={{ fontWeight: "bold" }}>{operation.name}:</div>
      <div style={{ marginLeft: 10 }}>{JSON.stringify(operation)}</div>
    </div>
  );
}
