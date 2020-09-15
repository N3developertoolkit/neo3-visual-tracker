import React from "react";

import Dialog from "../components/Dialog";
import InvokeFileViewRequest from "../../shared/messages/invokeFileViewRequest";
import InvokeFileViewState from "../../shared/viewState/invokeFileViewState";

type Props = {
  viewState: InvokeFileViewState;
  postMessage: (message: InvokeFileViewRequest) => void;
};

export default function InvokeFile({ viewState, postMessage }: Props) {
  return (
    <>
      {!!viewState.errorText && (
        <Dialog onClose={() => postMessage({ dismissError: true })}>
          {viewState.errorText}
        </Dialog>
      )}
      {!viewState.errorText && (
        <pre>{JSON.stringify(viewState.fileContents, undefined, 4)}</pre>
      )}
    </>
  );
}
