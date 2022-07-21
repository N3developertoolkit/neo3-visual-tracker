import React from "react";
import { useEffect } from "react";
import { WalletConnectContextProvider } from "@cityofzion/wallet-connect-sdk-react";
import { useWalletConnect } from "@cityofzion/wallet-connect-sdk-react";

import NavButton from "../NavButton";
import ConnectWalletViewState from "../../../shared/viewState/walletViewState";
import ConnectWalletViewRequest from "../../../shared/messages/walletViewRequest";

type Props = {
  viewState: ConnectWalletViewState;
  postMessage: (message: ConnectWalletViewRequest) => void;
};

const wcOptions = {
  chains: ["neo3:testnet", "neo3:mainnet"], // the blockchains your dapp accepts to connect
  logger: "debug", // use debug to show all log information on browser console
  methods: ["invokeFunction"], // which RPC methods do you plan to call
  relayServer: "wss://relay.walletconnect.org", // we are using walletconnect's official relay server,
  qrCodeModal: true, // to show a QRCode modal when connecting. Another option would be to listen to proposal event and handle it manually, described later
  appMetadata: {
    name: "MyApplicationName", // your application name to be displayed on the wallet
    description: "My Application description", // description to be shown on the wallet
    url: "https://myapplicationdescription.app/", // url to be linked on the wallet
    icons: ["https://myapplicationdescription.app/myappicon.png"], // icon to be shown on the wallet
  },
};

export default function ConnectWallet() {
  const walletConnectCtx = useWalletConnect();

  const connectWallet = async () => {
    await walletConnectCtx.connect();
    // the wallet is connected after the promise is resolved
  };

  useEffect(() => {
    if (walletConnectCtx.uri.length) {
      window
        .open(
          `https://neon.coz.io/connect?uri=${walletConnectCtx.uri}`,
          "_blank"
        )
        ?.focus();
    }
  }, [walletConnectCtx.uri]);

  return (
    <div>
      {walletConnectCtx.loadingSession ? (
        "Loading Session"
      ) : !walletConnectCtx.session ? (
        <a onClick={connectWallet}>Connect your Wallet</a>
      ) : (
        <ul>
          {walletConnectCtx.accounts.map((account) => {
            const [namespace, reference, address] = account.split(":");
            return (
              <li key={address}>
                <span>{walletConnectCtx.session?.peer.metadata.name}</span>
                <span>{address}</span>
                <a onClick={walletConnectCtx.disconnect}>Disconnect</a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
