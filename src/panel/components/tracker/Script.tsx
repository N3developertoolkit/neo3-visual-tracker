import React from "react";

import ContractNames from "../../../shared/contractNames";
import disassembleScript from "./disassembleScript";

const tryDisassemble = (script: string) => {
  try {
    return disassembleScript(script) || script;
  } catch {
    return script;
  }
};

type Props = {
  contractNames: ContractNames;
  script: string;
};

export default function Script({ script }: Props) {
  const style: React.CSSProperties = {
    fontFamily: "monospace",
    wordBreak: "break-all",
  };
  script = tryDisassemble(script);
  if (script.indexOf("\n") !== -1) {
    // TODO: Highlight known contracts referenced in script
    return (
      <span style={style}>
        {script.split("\n").map((_, i) => (
          <div key={`${i}_${_}`}>{_}</div>
        ))}
      </span>
    );
  } else {
    return <span style={style}>{script}</span>;
  }
}
