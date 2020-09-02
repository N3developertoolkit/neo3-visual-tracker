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
  };
  const cellStyle: React.CSSProperties = {
    textAlign: "center",
    padding: 5,
  };
  return (
    <table style={tableStyle}>
      <thead>
        {headings.map((heading) => (
          <th style={cellStyle} key={heading.key || undefined}>
            {heading.content}
          </th>
        ))}
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key || undefined}>
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
