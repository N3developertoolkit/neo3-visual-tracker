import React from "react";

import AddressDetails from "../tracker/AddressDetails";
import BlockDetails from "../tracker/BlockDetails";
import BlockList from "../tracker/BlockList";
import BlockNavigation from "../tracker/BlockNavigation";
import Dialog from "../Dialog";
import NavButton from "../NavButton";
import Search from "../tracker/Search";
import TrackerViewRequest from "../../../shared/messages/trackerViewRequest";
import TrackerViewState from "../../../shared/viewState/trackerViewState";
import TransactionDetails from "../tracker/TransactionDetails";

type Props = {
  viewState: TrackerViewState;
  postMessage: (message: TrackerViewRequest) => void;
};

export default function Tracker({ viewState, postMessage }: Props) {
  return (
    <>
      {!!viewState.selectedAddress && (
        <Dialog onClose={() => postMessage({ selectAddress: "" })}>
          <AddressDetails
            addressInfo={viewState.selectedAddress}
            autoCompleteData={viewState.autoCompleteData}
          />
        </Dialog>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "stretch",
          alignContent: "stretch",
          height: "100%",
        }}
      >
        <Search
          searchHistory={viewState.searchHistory}
          onSearch={(query) => postMessage({ search: query })}
        />
        <div
          style={{ flex: "none 1", overflow: "hidden", position: "relative" }}
        >
          {!!viewState.selectedBlock && (
            <div
              style={{
                backgroundColor: "var(--vscode-editor-background)",
                borderRadius: "10px 0px 0px 10px",
                borderTop: "1px solid var(--vscode-focusBorder)",
                borderBottom: "1px solid var(--vscode-focusBorder)",
                borderLeft: "1px solid var(--vscode-focusBorder)",
                boxShadow: "-1px 1px 3px 0px var(--vscode-focusBorder)",
                position: "absolute",
                top: 40,
                bottom: 40,
                right: 0,
                minWidth: "50vw",
                maxWidth: "80vw",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: "2 1 content",
                  overflowY: "scroll",
                  padding: 15,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.25rem",
                    textAlign: "right",
                    paddingBottom: 15,
                  }}
                >
                  <NavButton
                    style={{ float: "left" }}
                    onClick={() => postMessage({ selectBlock: "" })}
                  >
                    Close
                  </NavButton>
                  Block {viewState.selectedBlock.index}
                </div>
                <BlockDetails
                  autoCompleteData={viewState.autoCompleteData}
                  block={viewState.selectedBlock}
                  selectedTransactionHash={viewState.selectedTransaction?.hash}
                  selectAddress={(selectAddress) =>
                    postMessage({ selectAddress })
                  }
                  selectTransaction={(txid) =>
                    postMessage({ selectTransaction: txid })
                  }
                />
              </div>
              {!!viewState.selectedTransaction && (
                <div
                  style={{
                    flex: "1 1 content",
                    minHeight: 150,
                    overflowY: "scroll",
                    padding: 15,
                    borderTop: "1px solid var(--vscode-focusBorder)",
                    backgroundColor:
                      "var(--vscode-editor-inactiveSelectionBackground)",
                  }}
                >
                  <TransactionDetails
                    autoCompleteData={viewState.autoCompleteData}
                    transaction={viewState.selectedTransaction}
                    selectAddress={(address) =>
                      postMessage({ selectAddress: address })
                    }
                  />
                </div>
              )}
            </div>
          )}
          <div style={{ minHeight: "100vh" }}>
            <BlockList
              blocks={viewState.blocks}
              selectedBlock={viewState.selectedBlock}
              selectBlock={(hash) => postMessage({ selectBlock: hash })}
            />
          </div>
        </div>
        <BlockNavigation
          style={{ margin: 10, textAlign: "center" }}
          blocks={viewState.blocks}
          blockHeight={viewState.blockHeight}
          paginationDistance={viewState.paginationDistance}
          startAtBlock={viewState.startAtBlock}
          setStartAtBlock={(setStartAtBlock) =>
            postMessage({ setStartAtBlock })
          }
        />
      </div>
    </>
  );
}
