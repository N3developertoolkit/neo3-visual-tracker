import React from "react";

import AddressDetails from "../components/tracker/AddressDetails";
import BlockList from "../components/tracker/BlockList";
import BlockNavigation from "../components/tracker/BlockNavigation";
import Dialog from "../components/Dialog";
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
        <div style={{ flex: "none 1", overflow: "hidden" }}>
          <div style={{ minHeight: "100vh" }}>
            <BlockList
              blocks={viewState.blocks}
              selectedBlock={viewState.selectedBlock}
              selectedTransaction={viewState.selectedTransaction}
              selectAddress={(address) =>
                postMessage({ selectAddress: address })
              }
              selectBlock={(hash) => postMessage({ selectBlock: hash })}
              selectTransaction={(txid) =>
                postMessage({ selectTransaction: txid })
              }
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
