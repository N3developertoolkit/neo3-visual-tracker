import React from "react";
import { ContractParameterDefinitionJson } from "@cityofzion/neon-core/lib/sc";

import ArgumentInput from "./ArgumentInput";

type Props = {
  style?: React.CSSProperties;
  args: (string | number)[];
  parameterDefinitions: ContractParameterDefinitionJson[];
  setArguments: (newArguments: (string | number)[]) => void;
};

export default function ArgumentsInput({
  style,
  args,
  parameterDefinitions,
  setArguments,
}: Props) {
  return (
    <div style={style}>
      <div>
        <strong>Arguments:</strong>
      </div>
      {args.map((_, i) => (
        <ArgumentInput
          key={i}
          name={parameterDefinitions[i]?.name || `Argument #${i + 1}`}
          type={parameterDefinitions[i]?.type}
          arg={_}
          onUpdate={(arg: string | number) =>
            setArguments(
              args
                .map((__, j) => (i === j ? arg : __))
                .filter((__, j) => !!__ || j < parameterDefinitions.length)
            )
          }
        />
      ))}
      {!parameterDefinitions.length && (
        <ArgumentInput
          key={args.length}
          name={`Argument #${args.length + 1}`}
          onUpdate={(arg: string | number) =>
            setArguments(arg ? [...args, arg] : [...args])
          }
        />
      )}
    </div>
  );
}
