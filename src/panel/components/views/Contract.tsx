import React from "react";

import ContractViewState from "../../../shared/viewState/contractViewState";
import ContractViewRequest from "../../../shared/messages/contractViewRequest";

type Props = {
  viewState: ContractViewState;
  postMessage: (message: ContractViewRequest) => void;
};

export default function Contract({ viewState }: Props) {
  return <pre>{JSON.stringify(viewState, undefined, 2)}</pre>;
}
