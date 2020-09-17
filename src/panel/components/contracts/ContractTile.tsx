import React from "react";
import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

type Props = {
  manifest: ContractManifestJson;
  nefHints: { [hash: string]: { [nefPath: string]: boolean } };
  onMouseDown?: (newValue: string) => void;
};

export default function ContractTile({ manifest, nefHints, onMouseDown }: Props) {
  const style: React.CSSProperties = {
    border: "1px solid var(--vscode-dropdown-border)",
    backgroundColor: "var(--vscode-dropdown-background)",
    padding: 5,
    cursor: onMouseDown ? "pointer" : undefined,
  };
  const nefFiles = Object.getOwnPropertyNames(
    nefHints[manifest.abi.hash] || {}
  );
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
      {!!nefFiles.length && (
        <ul style={{ margin: 0 }}>
          {nefFiles.map((_) => (
            <li
              key={_}
              style={{
                marginLeft: 10,
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {_}
            </li>
          ))}
        </ul>
      )}
      {!!methods.length && (
        <div style={{ marginLeft: 10 }}>{methods.join(", ")}</div>
      )}
    </div>
  );
}
