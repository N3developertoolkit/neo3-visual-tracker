import React from "react";
import ReactDOM from "react-dom";

import ViewRouter from "./viewRouter";

import "./index.html";

function initialize() {
    ReactDOM.render(
      <React.StrictMode>
        <ViewRouter />
      </React.StrictMode>,
      document.getElementById("root")
    );
  }
  
  window.onload = initialize;
  