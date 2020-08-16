import React, { useEffect, useState } from "react";

import ControllerRequest from "../shared/controllerRequest";
import View from "../shared/view";
import ViewRequest from "../shared/viewRequest";

declare var acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

export default function ViewRouter() {
  const postMessage = (request: ViewRequest) => {
    console.log("📤", request);
    vscode.postMessage(request);
  };
  const receiveMessage = (request: ControllerRequest) => {
    console.log("📬", request);
    if (request.viewState.view !== view) {
      // Replace viewstate:
      setView(request.viewState.view);
      setViewState(request.viewState);
    } else {
      // Merge viewstate:
      setViewState((existing: any) => ({ ...existing, ...request.viewState }));
    }
  };
  const [view, setView] = useState<View | null>(null);
  const [viewState, setViewState] = useState<any>({});
  useEffect(() => {
    window.addEventListener("message", (msg) => receiveMessage(msg.data));
    postMessage({ retrieveViewState: true });
  }, []);
  switch (view) {
    case "tracker":
      return <div>TRACKER {JSON.stringify(viewState)}</div>;
    default:
      return <div>Loading...</div>;
  }
}
