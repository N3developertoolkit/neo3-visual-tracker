import React from "react";

import { ContractAbiJson } from "@cityofzion/neon-core/lib/sc";

type Props = {
  hash: string;
  abi: Partial<ContractAbiJson>;
  onMouseDown?: (newValue: string) => void;
};

export default function ContractTile({ hash, abi, onMouseDown }: Props) {
  const style: React.CSSProperties = {
    border: "1px solid var(--vscode-dropdown-border)",
    backgroundColor: "var(--vscode-dropdown-background)",
    padding: 5,
    cursor: onMouseDown ? "pointer" : undefined,
  };
  const methods = abi.methods?.map((_) => _.name) || [];
  return (
    <div
      style={style}
      onMouseDown={() => {
        if (onMouseDown) {
          onMouseDown(hash);
        }
      }}
    >
      <div style={{ fontWeight: "bold" }}>{hash}:</div>
      {!!methods.length && (
        <div style={{ marginLeft: 10 }}>{methods.join(", ")}</div>
      )}
    </div>
  );
}
