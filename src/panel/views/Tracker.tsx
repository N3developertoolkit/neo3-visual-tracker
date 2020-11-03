import React from "react";

import AddressDetails from "../components/tracker/AddressDetails";
import BlockDetails from "../components/tracker/BlockDetails";
import BlockList from "../components/tracker/BlockList";
import BlockNavigation from "../components/tracker/BlockNavigation";
import Dialog from "../components/Dialog";
import NavButton from "../components/NavButton";
import Search from "../components/tracker/Search";
import TrackerViewRequest from "../../shared/messages/trackerViewRequest";
import TrackerViewState from "../../shared/viewState/trackerViewState";

type Props = {
  viewState: TrackerViewState;
  postMessage: (message: TrackerViewRequest) => void;
};

export default function Tracker({ viewState, postMessage }: Props) {
  return (
    <>
      {!!viewState.selectedAddress && (
        <Dialog onClose={() => postMessage({ selectAddress: "" })}>
          <AddressDetails addressInfo={viewState.selectedAddress} />
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
                padding: 15,
                right: 0,
                minWidth: "50vw",
                maxWidth: "80vw",
                overflowY: "scroll",
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
                block={viewState.selectedBlock}
                selectedTransaction={viewState.selectedTransaction}
                selectAddress={(address) =>
                  postMessage({ selectAddress: address })
                }
                selectTransaction={(txid) =>
                  postMessage({ selectTransaction: txid })
                }
              />
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
