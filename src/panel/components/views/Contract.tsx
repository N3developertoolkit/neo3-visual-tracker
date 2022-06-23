import React from "react";

import ContractViewState from "../../../shared/viewState/contractViewState";
import ContractViewRequest from "../../../shared/messages/contractViewRequest";
import Hash from "../Hash";

type Props = {
  viewState: ContractViewState;
  postMessage: (message: ContractViewRequest) => void;
};

export default function Contract({ viewState, postMessage }: Props) {
  const hash = viewState.contractHash;
  const name =
    viewState.autoCompleteData.contractNames[hash] || "Unknown contract";
  const manifest = viewState.autoCompleteData.contractManifests[hash] || {};
  const extra = (manifest.extra || {}) as any;
  const description = extra["Description"] || undefined;
  const author = extra["Author"] || undefined;
  const email = extra["Email"] || undefined;
  const supportedStandards = manifest.supportedstandards || [];
  const contractPaths =
    viewState.autoCompleteData.contractPaths[hash] ||
    viewState.autoCompleteData.contractPaths[name] ||
    [];

  return (
    <div style={{ padding: 10 }}>
      <h1>{name}</h1>
      <button> Click to Delete </button>

      {!!description && (
        <p style={{ paddingLeft: 20 }}>
          <div style={{ fontWeight: "bold", marginBottom: 10, marginTop: 15 }}>
            Description:
          </div>
          <div style={{ paddingLeft: 20 }}>{description}</div>
        </p>
      )}
      {(!!author || !!email) && (
        <p style={{ paddingLeft: 20 }}>
          <div style={{ fontWeight: "bold", marginBottom: 10, marginTop: 15 }}>
            Author:
          </div>
          {!!author && <div style={{ paddingLeft: 20 }}>{author}</div>}
          {!!email && <div style={{ paddingLeft: 20 }}>&lt;{email}&gt;</div>}
        </p>
      )}
      <p style={{ paddingLeft: 20 }}>
        <div style={{ fontWeight: "bold", marginBottom: 10, marginTop: 15 }}>
          Hash:
        </div>
        <div
          style={{ cursor: "pointer", paddingLeft: 20 }}
          onClick={() => postMessage({ copyHash: true })}
        >
          <strong>
            <Hash hash={hash} />
          </strong>{" "}
          <em> &mdash; click to copy contract hash to clipboard</em>
        </div>
      </p>
      {!!supportedStandards.length && (
        <p style={{ paddingLeft: 20 }}>
          <div style={{ fontWeight: "bold", marginBottom: 10, marginTop: 15 }}>
            Supported standards:
          </div>
          <ul>
            {supportedStandards.map((_, i) => (
              <li key={i}>{_}</li>
            ))}
          </ul>
        </p>
      )}
      {!!contractPaths.length && (
        <p style={{ paddingLeft: 20 }}>
          <div style={{ fontWeight: "bold", marginBottom: 10, marginTop: 15 }}>
            Byte code location:
          </div>
          <ul>
            {contractPaths.map((_, i) => (
              <li key={i}>{_}</li>
            ))}
          </ul>
        </p>
      )}
    </div>
  );
}
