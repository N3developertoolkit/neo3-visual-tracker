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
    <>
      <BlockList blocks={viewState.blocks} />
      <BlockNavigation
        style={{ marginTop: "1.5em", textAlign: "center" }}
        blocks={viewState.blocks}
        blockHeight={viewState.blockHeight}
        blocksPerPage={viewState.blocksPerPage}
        startAtBlock={viewState.startAtBlock}
        setStartAtBlock={(setStartAtBlock) => postMessage({ setStartAtBlock })}
      />
    </>
  );
}
