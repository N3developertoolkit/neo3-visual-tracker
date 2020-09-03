import React from "react";

type Props = {
  headings: { key?: string; content: JSX.Element }[];
  rows: {
    key?: string;
    cells: { key?: string; colSpan?: number; content: JSX.Element }[];
  }[];
};

export default function Table({ headings, rows }: Props) {
  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
  };
  const theadStyle: React.CSSProperties = {
    backgroundColor: "var(--vscode-editor-selectionBackground)",
    color: "var(--vscode-editor-selectionForeground)",
  };
  const trStyleEven: React.CSSProperties = {
    backgroundColor: "var(--vscode-editor-background)",
    color: "var(--vscode-editor-foreground)",
  };
  const trStyleOdd: React.CSSProperties = {
    backgroundColor: "var(--vscode-editor-inactiveSelectionBackground)",
    color: "var(--vscode-editor-foreground)",
  };
  const cellStyle: React.CSSProperties = {
    textAlign: "center",
    padding: 5,
  };
  return (
    <table style={tableStyle}>
      <thead style={theadStyle}>
        {headings.map((heading) => (
          <th style={cellStyle} key={heading.key || undefined}>
            {heading.content}
          </th>
        ))}
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={row.key || undefined}
            style={i % 2 === 0 ? trStyleEven : trStyleOdd}
          >
            {row.cells.map((cell) => (
              <td
                key={cell.key || undefined}
                style={cellStyle}
                colSpan={cell.colSpan}
              >
                {cell.content}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
