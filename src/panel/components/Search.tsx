import React, { useState } from "react";

import NavButton from "./NavButton";

type Props = {
  searchHistory: string[];
  onSearch: (query: string) => void;
};

export default function Search({ searchHistory, onSearch }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const formStyle: React.CSSProperties = {
    padding: 10,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    fontSize: "1.25rem",
    padding: 5,
    color: "var(--vscode-input-foreground)",
    backgroundColor: "var(--vscode-input-background)",
    border: "1px solid var(--vscode-input-border)",
  };
  const dataListId = `list_${Math.random()}`;
  return (
    <form
      style={formStyle}
      onSubmit={() => {
        onSearch(searchInput);
        setSearchInput("");
      }}
    >
      <input
        type="text"
        placeholder="Enter a block number/hash, transaction ID or address&hellip;"
        style={inputStyle}
        value={searchInput}
        list={dataListId}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      <datalist id={dataListId}>
        {searchHistory.map((_) => (
          <option value={_} />
        ))}
      </datalist>
      <div
        style={{
          paddingTop: 10,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {searchHistory.map((_) => (
          <NavButton
            key={_}
            roundedBadge
            style={{ marginRight: 10, display: "inline" }}
            onClick={() => onSearch(_)}
          >
            {_}
          </NavButton>
        ))}
      </div>
    </form>
  );
}
