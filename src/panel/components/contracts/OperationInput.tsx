import React, { useState } from "react";
import { ContractMethodDefinitionJson } from "@cityofzion/neon-core/lib/sc";

import OperationTile from "./OperationTile";

type Props = {
  style?: React.CSSProperties;
  operation?: string;
  operations: ContractMethodDefinitionJson[];
  setOperation: (newValue: string) => void;
};

export default function OperationInput({
  style,
  operation,
  operations,
  setOperation,
}: Props) {
  const [hasFocus, setHasFocus] = useState(false);
  const inputStyle: React.CSSProperties = {
    color: "var(--vscode-input-foreground)",
    backgroundColor: "var(--vscode-input-background)",
    border: "1px solid var(--vscode-input-border)",
    boxSizing: "border-box",
    width: "calc(100% - 15px)",
    fontSize: "0.9rem",
    padding: 2,
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
  return (
    <div style={{ ...style, position: "relative" }}>
      <div>
        <strong>Operation:</strong>
      </div>
      <input
        style={inputStyle}
        type="text"
        value={operation}
        onChange={(e) => setOperation(e.target.value)}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
      />
      {hasFocus && !!operations.length && (
        <div style={dropdownStyle}>
          {operations.map((operation) => (
            <OperationTile
              key={operation.name}
              operation={operation}
              onMouseDown={setOperation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
