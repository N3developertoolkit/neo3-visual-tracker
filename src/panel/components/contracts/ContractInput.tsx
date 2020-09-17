import React, { useState } from "react";
import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import ContractTile from "./ContractTile";

type Props = {
  contract?: string;
  contracts: { [hashOrNefFile: string]: ContractManifestJson };
  nefHints: { [hash: string]: { [nefPath: string]: boolean } };
  setContract: (newValue: string) => void;
};

export default function ContractInput({
  contract,
  contracts,
  nefHints,
  setContract,
}: Props) {
  const [hasFocus, setHasFocus] = useState(false);
  const inputStyle: React.CSSProperties = {
    color: "var(--vscode-input-foreground)",
    backgroundColor: "var(--vscode-input-background)",
    border: "1px solid var(--vscode-input-border)",
    boxSizing: "border-box",
    width: "100%",
    fontSize: "1.1rem",
    padding: 5,
    marginTop: 5,
  };
  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 1,
    left: 20,
    right: 20,
    color: "var(--vscode-dropdown-foreground)",
    backgroundColor: "var(--vscode-dropdown-background)",
    border: "1px solid var(--vscode-dropdown-border)",
    maxHeight: "80vh",
    overflow: "auto",
  };
  const contractManifests = Object.values(contracts);
  return (
    <div style={{ position: "relative" }}>
      <div>
        <strong>Contract:</strong>
      </div>
      <input
        style={inputStyle}
        type="text"
        value={contract}
        onChange={(e) => setContract(e.target.value)}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
      />
      {hasFocus && !!contractManifests.length && (
        <div style={dropdownStyle}>
          {contractManifests.map((manifest) => (
            <ContractTile
              key={manifest.abi.hash}
              manifest={manifest}
              nefHints={nefHints}
              onMouseDown={setContract}
            />
          ))}
        </div>
      )}
    </div>
  );
}
