import React from "react";

import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

type Props = {
  manifest: ContractManifestJson;
  onMouseDown?: (newValue: string) => void;
};

export default function ContractTile({ manifest, onMouseDown }: Props) {
  const style: React.CSSProperties = {
    border: "1px solid var(--vscode-dropdown-border)",
    backgroundColor: "var(--vscode-dropdown-background)",
    padding: 5,
    cursor: onMouseDown ? "pointer" : undefined,
  };
  const methods = manifest.abi.methods.map((_) => _.name);
  return (
    <div
      style={style}
      onMouseDown={() => {
        if (onMouseDown) {
          onMouseDown(manifest.abi.hash);
        }
      }}
    >
      <div style={{ fontWeight: "bold" }}>{manifest.abi.hash}:</div>
      {!!methods.length && (
        <div style={{ marginLeft: 10 }}>{methods.join(", ")}</div>
      )}
    </div>
  );
}
