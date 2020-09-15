import React from "react";

type Props = {
  contract?: string;
  operation?: string;
  args?: (string | number)[];
};

export default function InvocationStep({ contract, operation, args }: Props) {
  return (
    <div
      style={{
        backgroundColor: "var(--vscode-editorWidget-background)",
        color: "var(--vscode-editorWidget-foreground)",
        border: "var(--vscode-editorWidget-border)",
        margin: 10,
        padding: 10,
      }}
    >
      <div>{contract}</div>
      <div>{operation}</div>
      <div>{args}</div>
    </div>
  );
}
