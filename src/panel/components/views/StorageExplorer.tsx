import React from "react";

import NavButton from "../NavButton";
import StorageExplorerViewRequest from "../../../shared/messages/storageExplorerViewRequest";
import StorageExplorerViewState from "../../../shared/viewState/storageExplorerViewState";

type Props = {
  viewState: StorageExplorerViewState;
  postMessage: (message: StorageExplorerViewRequest) => void;
};

export default function StorageExplorer({ viewState, postMessage }: Props) {
  return (
    <>
      <div>
        <select
          onChange={(e) => postMessage({ selectContract: e.target.value })}
        >
          {viewState.contracts.map((_) => (
            <option key={_} value={_}>
              {_}
            </option>
          ))}
        </select>
      </div>
      {!!viewState.error && (
        <div style={{ color: "var(--vscode-errorForeground)" }}>
          {viewState.error}
        </div>
      )}
      <div>
        <pre>{JSON.stringify(viewState.storage, undefined, 2)}</pre>
      </div>
      <div>
        <NavButton onClick={() => postMessage({ refresh: true })}>
          Refresh
        </NavButton>
      </div>
    </>
  );
}
