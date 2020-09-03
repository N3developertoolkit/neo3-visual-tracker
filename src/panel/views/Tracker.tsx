import React from "react";

import BlockList from "../components/BlockList";
import BlockNavigation from "../components/BlockNavigation";
import TrackerViewState from "../../shared/viewState/trackerViewState";
import TrackerViewRequest from "../../shared/messages/trackerViewRequest";

type Props = {
  viewState: TrackerViewState;
  postMessage: (message: TrackerViewRequest) => void;
};

export default function Tracker({ viewState, postMessage }: Props) {
  return (
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
      <div style={{ flex: "none 1", overflow: "hidden" }}>
        <BlockList
          blocks={viewState.blocks}
          selectedBlock={viewState.selectedBlock}
          selectBlock={(index) => postMessage({ selectBlock: index })}
        />
      </div>
      <BlockNavigation
        style={{ margin: 10, textAlign: "center" }}
        blocks={viewState.blocks}
        blockHeight={viewState.blockHeight}
        paginationDistance={viewState.paginationDistance}
        startAtBlock={viewState.startAtBlock}
        setStartAtBlock={(setStartAtBlock) => postMessage({ setStartAtBlock })}
      />
    </div>
  );
}
