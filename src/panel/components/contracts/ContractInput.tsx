import React, { Fragment, useState } from "react";

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
    fontSize: "1.0rem",
    padding: 5,
    marginTop: 5,
    marginLeft: 15,
  };
  const descriptionStyle: React.CSSProperties = {
    marginTop: 5,
    marginLeft: 15,
    fontWeight: "bold",
  };
  const akaStyle: React.CSSProperties = {
    marginTop: 5,
    marginLeft: 30,
    fontStyle: "italic",
  };
  const akaItemStyle: React.CSSProperties = {
    textDecoration: "underline",
    cursor: "pointer",
    marginTop: 3,
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
  const allHashes = Object.keys(autoCompleteData.contractManifests);
  const contractHash =
    autoCompleteData.contractHashes[contract || ""] || contract || "";
  const names = autoCompleteData.contractNames[contractHash] || [];
  const paths = autoCompleteData.contractPaths[contractHash] || [];
  const title = names[0] ? names[0] : paths[0] ? paths[0] : "Unknown contract";
  const aka = [contractHash, ...paths].filter((_) => !!_ && _ !== contract);
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
      {hasFocus && !!allHashes.length && (
        <div style={dropdownStyle}>
          {allHashes.map((hash, i) => {
            const manifest = autoCompleteData.contractManifests[hash];
            return manifest?.abi ? (
              <ContractTile
                key={hash}
                hash={hash}
                abi={manifest.abi}
                onMouseDown={setContract}
              />
            ) : (
              <Fragment key={`missing_${i}`}></Fragment>
            );
          })}
        </div>
      )}
      <div style={descriptionStyle}>{title}</div>
      {!!aka.length && (
        <div style={akaStyle}>
          <div>This contract can also be referred to as:</div>
          <ul style={{ marginTop: 0 }}>
            {aka.map((_) => (
              <li key={_} style={akaItemStyle} onClick={() => setContract(_)}>
                {_}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
