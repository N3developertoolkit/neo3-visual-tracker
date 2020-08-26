import React from "react";

import BlockList from "../components/BlockList";
import TrackerViewState from "../../shared/viewState/trackerViewState";

type Props = {
  viewState: TrackerViewState;
};

export default function Tracker({ viewState }: Props) {
  return (
    <BlockList blocks={viewState.blocks} />
  );
}
