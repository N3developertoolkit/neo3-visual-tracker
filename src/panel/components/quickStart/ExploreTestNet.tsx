import React from "react";

import NavButton from "../NavButton";

type Props = {
  onOpen: () => void;
};

export default function ExploreTestNet({ onOpen }: Props) {
  return (
    <>
      <div style={{ margin: 10, textAlign: "left" }}>
        You have access to a Neo blockchain explorer within Visual Studio Code.
      </div>
      <NavButton style={{ margin: 10 }} onClick={onOpen}>
        Explore Neo 3 TestNet
      </NavButton>
    </>
  );
}
