import React from "react";
import ReactDOM from "react-dom";

import "./index.html";

function initialize() {
    ReactDOM.render(
      <React.StrictMode>
        <div>Hello world!</div>
      </React.StrictMode>,
      document.getElementById("root")
    );
  }
  
  window.onload = initialize;
  