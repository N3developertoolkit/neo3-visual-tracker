import React from "react";

import CreateNeoExpressInstance from "../components/quickStart/CreateNeoExpressInstance";
import CreateOrOpenWorkspace from "../components/quickStart/CreateOrOpenWorkspace";
import OpenBlockchainExplorer from "../components/quickStart/OpenBlockchainExplorer";
import QuickStartViewRequest from "../../shared/messages/quickStartFileViewRequest";
import QuickStartViewState from "../../shared/viewState/quickStartViewState";
import StartNeoExpress from "../components/quickStart/StartNeoExpress";

type Props = {
  viewState: QuickStartViewState;
  postMessage: (message: QuickStartViewRequest) => void;
};

export default function QuickStart({ viewState, postMessage }: Props) {
  const actions: JSX.Element[] = [];
  if (viewState.workspaceIsOpen) {
    if (viewState.hasNeoExpressInstance) {
      if (viewState.neoExpressIsRunning) {
        // TODO: Offer to connect if needed
      } else {
        actions.push(
          <StartNeoExpress
            onStart={() =>
              postMessage({ command: "neo3-visual-devtracker.express.run" })
            }
          />
        );
      }
    } else {
      actions.push(
        <CreateNeoExpressInstance
          onCreate={() =>
            postMessage({ command: "neo3-visual-devtracker.express.create" })
          }
        />
      );
    }
    // TODO: Offer to create contracts, wallets, etc.
  } else {
    actions.push(
      <CreateOrOpenWorkspace
        onOpen={() => postMessage({ command: "vscode.openFolder" })}
      />
    );
  }
  actions.push(
    <OpenBlockchainExplorer
      onOpen={() =>
        postMessage({ command: "neo3-visual-devtracker.tracker.openTracker" })
      }
    />
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
