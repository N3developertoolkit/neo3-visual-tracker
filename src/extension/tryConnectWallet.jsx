import SignClient from "@walletconnect/sign-client";
import { Buffer } from "buffer";

import React, { useEffect } from "react";

/* if (!window.Buffer) {
  window.Buffer = Buffer;
} */

import { WcSdk } from "@cityofzion/wallet-connect-sdk-core";

/* interface wcTypes {
  projectId: any,
  relayUrl: any
  metadata: {
    name: any,
    description: any,
    url: any,
    icons: any
  }
} */

//added a class to be like the example given in index.ts with serverlistdetector.customize().. still didn't work!
export default class TryConnectWallet {
  static async ConnectWallet5() {
    let wcSdk = new WcSdk(
      SignClient.init({
        projectId: "<your wc project id>", // the ID of your project on Wallet Connect website
        relayUrl: "wss://relay.walletconnect.com", // we are using walletconnect's official relay server
        metadata: {
          name: "MyApplicationName", // your application name to be displayed on the wallet
          description: "My Application description", // description to be shown on the wallet
          url: "https://myapplicationdescription.app/", // url to be linked on the wallet
          icons: ["https://myapplicationdescription.app/myappicon.png"], // icon to be shown on the wallet
        },
      })
    );

    /*   const connectWallet = async () => {
      await walletConnectCtx.connect();
      // the wallet is connected after the promise is resolved
    };
 */

    if (wcSdk.isConnected()) {
      console.log(wcSdk.getAccountAddress()); // print the first connected account address
      console.log(wcSdk.getChainId()); // print the first connected account chain info
      console.log(wcSdk.session.namespaces); // print the blockchain dictionary with methods, accounts and events
      console.log(wcSdk.session.peer.metadata); // print the wallet metadata
    }

    if (!wcSdk.isConnected()) {
      await wcSdk.connect("neo3:testnet"); // choose between neo3:mainnet, neo3:testnet or neo3:private
      // and check if there is a connection
      console.log(
        wcSdk.isConnected() ? "Connected successfully" : "Connection refused"
      );
    }

    return <div className="App"></div>;
  }
}
