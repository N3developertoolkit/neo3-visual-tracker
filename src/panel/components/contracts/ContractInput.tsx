import React, { useState } from "react";

import AutoCompleteData from "../../../shared/autoCompleteData";
import ContractTile from "./ContractTile";

type Props = {
  style?: React.CSSProperties;
  contract?: string;
  autoCompleteData: AutoCompleteData;
  setContract: (newValue: string) => void;
};

export default function ContractInput({
  style,
  contract,
  autoCompleteData,
  setContract,
}: Props) {
  const [hasFocus, setHasFocus] = useState(false);
  const inputStyle: React.CSSProperties = {
    color: "var(--vscode-input-foreground)",
    backgroundColor: "var(--vscode-input-background)",
    border: "1px solid var(--vscode-input-border)",
    boxSizing: "border-box",
    width: "calc(100% - 15px)",
    fontSize: "1.1rem",
    padding: 5,
    marginTop: 5,
    marginLeft: 15,
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
  const contractManifests = Object.values(autoCompleteData.contractManifests);
  return (
    <div style={{ ...style, position: "relative" }}>
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
          {contractManifests.map((manifest, i) => (
            <ContractTile
              key={`${i}_${manifest.abi?.hash}`}
              manifest={manifest}
              onMouseDown={setContract}
            />
          ))}
        </div>
      )}
    </div>
  );
}
