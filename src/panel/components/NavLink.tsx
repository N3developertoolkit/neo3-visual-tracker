import React, { useState } from "react";

type Props = {
  children: JSX.Element | string;
  style?: React.CSSProperties;
  onClick: () => void;
};

export default function NavLink({ children, style, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const linkStyle: React.CSSProperties = {
    color: hover
      ? "var(--vscode-textLink-activeForeground)"
      : "var(--vscode-textLink-foreground)",
    textDecoration: hover ? "underline" : undefined,
    cursor: "pointer",
  };
  return (
    <span style={style}>
      <span
        style={linkStyle}
        onClick={onClick}
        onMouseMove={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </span>
    </span>
  );
}
