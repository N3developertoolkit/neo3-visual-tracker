import React from "react";

import StorageExplorerViewRequest from "../../../shared/messages/storageExplorerViewRequest";
import StorageExplorerViewState from "../../../shared/viewState/storageExplorerViewState";

type Props = {
  viewState: StorageExplorerViewState;
  postMessage: (message: StorageExplorerViewRequest) => void;
};

export default function StorageExplorer({}: Props) {
  return <>Hello world!</>;
}
