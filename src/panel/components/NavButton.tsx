import React, { useState, useEffect } from "react";

type Props = {
  children: JSX.Element | string;
  disabled?: boolean;
  secondary?: boolean;
  style?: React.CSSProperties;
  onClick: () => void;
};

export default function NavButton({
  children,
  disabled,
  secondary,
  style,
  onClick,
}: Props) {
  const [hover, setHover] = useState(false);
  useEffect(() => setHover(disabled ? false : hover), [disabled]);
  const buttonStyle: React.CSSProperties = {
    backgroundColor: secondary
      ? "var(--vscode-button-secondaryBackground)"
      : "var(--vscode-button-background)",
    color: secondary
      ? "var(--vscode-button-secondaryForeground)"
      : "var(--vscode-button-foreground)",
    border: "none",
    padding: "1em 2em 1em 2em",
  };
  const buttonStyleHover: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: secondary
      ? "var(--vscode-button-secondaryHoverBackground)"
      : "var(--vscode-button-hoverBackground)",
    cursor: "pointer",
  };
  return (
    <span style={style}>
      <button
        type="button"
        style={hover && !disabled ? buttonStyleHover : buttonStyle}
        disabled={!!disabled}
        onClick={onClick}
        onMouseMove={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </button>
    </span>
  );
}
