import React from "react";

type Props = {
  title: string;
  children: any;
};

export default function MetadataBadge({ title, children }: Props) {
  const style: React.CSSProperties = {
    textAlign: "right",
    margin: 5,
  };
  const titleStyle: React.CSSProperties = {
    fontWeight: "bold",
    fontSize: "0.6rem",
    textTransform: "uppercase",
    marginBottom: 2,
  };
  const badgeStyle: React.CSSProperties = {
    backgroundColor: "var(--vscode-badge-background)",
    color: "var(--vscode-badge-foreground)",
    borderRadius: "10px 0 0 10px",
    padding: 5,
    maxHeight: "3em",
    overflow: "auto",
  };
  return (
    <div style={style}>
      <div style={titleStyle}>{title}</div>
      <div style={badgeStyle}>{children}</div>
    </div>
  );
}
