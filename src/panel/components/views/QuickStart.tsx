import React from "react";

import ConnectToBlockchain from "../quickStart/ConnectToBlockchain";
import CreateContract from "../quickStart/CreateContract";
import CreateNeoExpressInstance from "../quickStart/CreateNeoExpressInstance";
import CreateOrOpenWorkspace from "../quickStart/CreateOrOpenWorkspace";
import CreateWallet from "../quickStart/CreateWallet";
import DeployContract from "../quickStart/DeployContract";
import OpenBlockchainExplorer from "../quickStart/OpenBlockchainExplorer";
import QuickStartViewRequest from "../../../shared/messages/quickStartViewRequest";
import QuickStartViewState from "../../../shared/viewState/quickStartViewState";
import StartNeoExpress from "../quickStart/StartNeoExpress";
import InvokeContract from "../quickStart/InvokeContract";

import ConnectWallet from "../quickStart/ConnectWallet";
//Created on 6/22/2022- Rob

type Props = {
  viewState: QuickStartViewState;
  postMessage: (message: QuickStartViewRequest) => void;
};

export default function QuickStart({ viewState, postMessage }: Props) {
  const actions: JSX.Element[] = [];
  if (viewState.workspaceIsOpen) {
    if (viewState.hasNeoExpressInstance) {
      if (!viewState.neoExpressIsRunning) {
        actions.push(
          <StartNeoExpress
            key="startNeoExpress"
            onStart={() =>
              postMessage({ command: "neo3-visual-devtracker.express.run" })
            }
          />
        );
        actions.push(
          <ConnectWallet
            key="connectWallet"
            onConnectWallet={() =>
              postMessage({
                command: "neo3-visual-devtracker.neo.walletConnect",
              })
            }
          />
        );
      }
    } else {
      actions.push(
        <CreateNeoExpressInstance
          key="createNeoExpressInstance"
          onCreate={() =>
            postMessage({ command: "neo3-visual-devtracker.express.create" })
          }
        />
      );
    }
    if (!viewState.hasContracts) {
      actions.push(
        <CreateContract
          key="createContract"
          onCreate={() =>
            postMessage({ command: "neo3-visual-devtracker.neo.newContract" })
          }
        />
      );
    }
    if (viewState.connectionName) {
      if (viewState.neoExpressDeploymentRequired) {
        actions.push(
          <DeployContract
            key="deployContractNeo"
            connectionName={viewState.connectionName}
            onDeploy={() =>
              postMessage({
                command: "neo3-visual-devtracker.express.contractDeploy",
              })
            }
          />
        );
      } else if (viewState.neoDeploymentRequired) {
        actions.push(
          <DeployContract
            key="deployContractNeoExpress"
            connectionName={viewState.connectionName}
            onDeploy={() =>
              postMessage({
                command: "neo3-visual-devtracker.neo.contractDeploy",
              })
            }
          />
        );
      } else if (viewState.hasDeployedContract) {
        actions.push(
          <InvokeContract
            key="invokeContract"
            onInvoke={() =>
              postMessage({
                command: "neo3-visual-devtracker.neo.invokeContract",
              })
            }
          />
        );
      }
    } else {
      /*  actions.push(
        <ConnectToBlockchain
          key="connectToBlockchain"
          onConnect={() =>
            postMessage({ command: "neo3-visual-devtracker.connect" })
          }
        />
      ); */
      actions.push(
        <ConnectWallet
          key="connectWallet"
          onConnectWallet={() =>
            postMessage({
              command: "neo3-visual-devtracker.neo.walletConnect",
            })
          }
        />
      );
    }
    if (!viewState.hasWallets) {
      actions.push(
        <CreateWallet
          key="createWallet"
          onCreate={() =>
            postMessage({
              command: "neo3-visual-devtracker.neo.walletCreate",
            })
          }
        />
      );
    } else if (viewState.hasWallets) {
      actions.push(
        <ConnectWallet
          key="connectWallet"
          onConnectWallet={() =>
            postMessage({
              command: "neo3-visual-devtracker.neo.walletConnect",
            })
          }
        />
      );
      actions.push(
        <ConnectWallet
          key="connectWallet"
          onConnectWallet={() =>
            postMessage({
              command: "neo3-visual-devtracker.neo.walletConnect",
            })
          }
        />
      );
    } else if (viewState.hasWallets) {
      actions.push(
        <ConnectWallet
          key="connectWallet"
          onConnectWallet={() =>
            postMessage({
              command: "neo3-visual-devtracker.neo.walletConnect",
            })
          }
        />
      );
      // TODO: Offer to create NEP-6 wallets if there is not one in the workspace
      // TODO: Offer to create Neo Express wallets if only genesis exists
      // TODO: Offter to transfer assets between Neo Express wallets if only genesis has funds but other wallets exist
      // TODO: Offer to create a checkpoint if neo-express is running and sufficiently "interesting"
      // TODO: Offer to restore a checkpoint if any are present in the workspace
    } else {
      actions.push(
        <CreateOrOpenWorkspace
          key="createOrOpenWorkspace"
          onOpen={() => postMessage({ command: "vscode.openFolder" })}
        />
      );
    }
    actions.push(
      <OpenBlockchainExplorer
        key="openBlockchainExplorer"
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
}
