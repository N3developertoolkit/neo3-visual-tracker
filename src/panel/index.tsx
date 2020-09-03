import React from "react";
import ReactDOM from "react-dom";

import ViewRouter from "./viewRouter";

import "./index.html";

function initialize() {
  const negateVsCodeMargin: React.CSSProperties = { margin: "0 -20px" };
  ReactDOM.render(
    <React.StrictMode>
      <div style={negateVsCodeMargin}>
        <ViewRouter />
      </div>
    </React.StrictMode>,
    document.getElementById("root")
  );
}

window.onload = initialize;
