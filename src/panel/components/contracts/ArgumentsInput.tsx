import React from "react";
import { ContractParameterDefinitionJson } from "@cityofzion/neon-core/lib/sc";

import ArgumentInput from "./ArgumentInput";

type Props = {
  args: (string | number)[];
  autoSuggestListId: string;
  isReadOnly: boolean;
  parameterDefinitions?: ContractParameterDefinitionJson[];
  style?: React.CSSProperties;
  setArguments: (newArguments: (string | number)[]) => void;
};

export default function ArgumentsInput({
  args,
  autoSuggestListId,
  isReadOnly,
  parameterDefinitions,
  style,
  setArguments,
}: Props) {
  while (args.length && !args[args.length - 1]) {
    args.length--;
  }
  while (args.length < (parameterDefinitions?.length || 0)) {
    args.push("");
  }
  return (
    <div style={style}>
      {(!parameterDefinitions || !!args.length) && (
        <div>
          <strong>Arguments:</strong>
        </div>
      )}
      {args.map((_, i) => (
        <ArgumentInput
          arg={_}
          autoSuggestListId={autoSuggestListId}
          isReadOnly={isReadOnly}
          key={`${i}_${_}`}
          name={(parameterDefinitions || [])[i]?.name || `Argument #${i + 1}`}
          type={(parameterDefinitions || [])[i]?.type}
          onUpdate={(arg: string | number) =>
            setArguments(
              args
                .map((__, j) => (i === j ? arg : __))
                .filter(
                  (__, j) => !!__ || j < (parameterDefinitions?.length || 0)
                )
            )
          }
        />
      ))}
      {!parameterDefinitions && (
        <ArgumentInput
          autoSuggestListId={autoSuggestListId}
          isReadOnly={isReadOnly}
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
