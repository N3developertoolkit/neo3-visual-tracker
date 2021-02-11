import React from "react";

import StorageExplorerViewRequest from "../../../shared/messages/storageExplorerViewRequest";
import StorageExplorerViewState from "../../../shared/viewState/storageExplorerViewState";

type Props = {
  viewState: StorageExplorerViewState;
  postMessage: (message: StorageExplorerViewRequest) => void;
};

export default function StorageExplorer({ viewState }: Props) {
  return <pre>{JSON.stringify(viewState, undefined, 2)}</pre>;
}
