import React from "react";

type Props = {
  title: string;
  children: any;
};

export default function MetadataBadge({ title, children }: Props) {
  const badgeStyle: React.CSSProperties = {
    backgroundColor: "var(--vscode-badge-background)",
    color: "var(--vscode-badge-foreground)",
    textAlign: "center",
    borderRadius: 10,
    margin: 5,
    padding: 5,
  };
  const titleStyle: React.CSSProperties = {
    fontWeight: "bold",
    fontSize: "0.6rem",
    textTransform: "uppercase",
    marginBottom: 2,
  };
  return (
    <div style={badgeStyle}>
      <div style={titleStyle}>{title}:</div>
      <div>{children}</div>
    </div>
  );
}
