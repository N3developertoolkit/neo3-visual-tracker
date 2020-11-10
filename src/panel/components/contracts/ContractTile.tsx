import React from "react";
import { ContractAbiJson } from "@cityofzion/neon-core/lib/sc";

import AutoCompleteData from "../../../shared/autoCompleteData";

type Props = {
  hash: string;
  abi: Partial<ContractAbiJson>;
  autoCompleteData: AutoCompleteData;
  onMouseDown?: (newValue: string) => void;
};

export default function ContractTile({
  hash,
  abi,
  autoCompleteData,
  onMouseDown,
}: Props) {
  const style: React.CSSProperties = {
    borderBottom: "1px solid var(--vscode-dropdown-border)",
    backgroundColor: "var(--vscode-dropdown-background)",
    padding: 5,
    cursor: onMouseDown ? "pointer" : undefined,
  };
  const methodStyle: React.CSSProperties = {
    backgroundColor: "var(--vscode-button-background)",
    color: "var(--vscode-button-foreground)",
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 2,
    paddingBottom: 2,
    marginRight: 10,
    borderRadius: 10,
  };
  const names = autoCompleteData.contractNames[hash] || [];
  const paths = autoCompleteData.contractPaths[hash] || [];
  const title = names[0] ? names[0] : paths[0] ? paths[0] : "Unknown contract";
  const methods = abi.methods?.map((_) => _.name) || [];
  const aka = [hash, ...paths].filter((_) => !!_);
  return (
    <div
      style={style}
      onMouseDown={() => {
        if (onMouseDown) {
          onMouseDown(hash);
        }
      }}
    >
      <div>
        <strong>{title}</strong>
      </div>
      {!!aka.length && (
        <ul
          style={{
            marginLeft: 10,
            marginTop: 5,
            marginBottom: 5,
            paddingLeft: 15,
          }}
        >
          {aka.map((_) => (
            <li key={_}>{_}</li>
          ))}
        </ul>
      )}
      {!!methods.length && (
        <div
          style={{
            marginLeft: 10,
            marginBottom: 5,
            lineHeight: 2,
          }}
        >
          {methods.map((_) => (
            <>
              <span key={_} style={methodStyle}>
                {_}
              </span>{" "}
            </>
          ))}
        </div>
      )}
    </div>
  );
}
