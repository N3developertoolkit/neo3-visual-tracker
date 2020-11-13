import React from "react";

import CreateOrOpenWorkspace from "../components/quickStart/CreateOrOpenWorkspace";
import ExploreTestNet from "../components/quickStart/ExploreTestNet";
import QuickStartViewRequest from "../../shared/messages/quickStartFileViewRequest";
import QuickStartViewState from "../../shared/viewState/quickStartViewState";

type Props = {
  viewState: QuickStartViewState;
  postMessage: (message: QuickStartViewRequest) => void;
};

export default function QuickStart({ viewState, postMessage }: Props) {
  const actions: JSX.Element[] = [];
  if (viewState.workspaceIsOpen) {
    // TODO: Offer to create contracts, instances, etc.
  } else {
    actions.push(
      <CreateOrOpenWorkspace
        onOpen={() => postMessage({ openWorkspace: true })}
      />
    );
  }
  actions.push(
    <ExploreTestNet onOpen={() => postMessage({ exploreTestNet: true })} />
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        alignItems: "center",
        textAlign: "center",
        minHeight: "calc(100% - 20px)",
        padding: 10,
      }}
    >
      {actions}
    </div>
  );
}
