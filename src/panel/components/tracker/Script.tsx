import React from "react";

import ContractNames from "../../../shared/contractNames";
import disassembleScript from "./disassembleScript";
import ScriptToken from "./ScriptToken";

const tryDisassemble = (script: string) => {
  try {
    return disassembleScript(script) || script;
  } catch {
    return script;
  }
};

const tokenizeScript = (script: string) => {
  return script.split("\n").map((line) => line.trim().split(/\s+/g));
};
type Props = {
  contractNames: ContractNames;
  script: string;
};

export default function Script({ contractNames, script }: Props) {
  const style: React.CSSProperties = {
    fontFamily: "monospace",
    wordBreak: "break-all",
  };
  const scriptLines = tokenizeScript(tryDisassemble(script));
  return (
    <div style={style}>
      {scriptLines.map((lineTokens, i) => (
        <div key={`${i}.${lineTokens.join(".")}`}>
          {lineTokens.map((_, i) => (
            <ScriptToken
              contractNames={contractNames}
              key={`${i}.${_}`}
              token={_}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
