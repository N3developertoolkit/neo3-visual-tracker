import React from "react";

import CreateOrOpenWorkspace from "../components/quickStart/CreateOrOpenWorkspace";
import QuickStartViewRequest from "../../shared/messages/quickStartFileViewRequest";
import QuickStartViewState from "../../shared/viewState/quickStartViewState";

type Props = {
  viewState: QuickStartViewState;
  postMessage: (message: QuickStartViewRequest) => void;
};

export default function QuickStart({ viewState, postMessage }: Props) {
  const headingText = "Welcome to the Neo 3 Visual DevTracker!";
  const actions: JSX.Element[] = [];
  if (viewState.workspaceIsOpen) {
    actions.push(<>TODO...</>);
  } else {
    actions.push(
      <CreateOrOpenWorkspace
        onOpen={() => postMessage({ openWorkspace: true })}
      />
    );
  }
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
      <h2 style={{ margin: 10, padding: 0 }}>{headingText}</h2>
      {actions}
    </div>
  );
}
