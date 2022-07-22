import * as fs from "fs";
import * as neonCore from "@cityofzion/neon-core";
import * as neonExperimental from "../neonExperimental/index";
import * as path from "path";
import * as vscode from "vscode";

import ActiveConnection from "../activeConnection";
import BlockchainsTreeDataProvider from "../vscodeProviders/blockchainsTreeDataProvider";
import { CommandArguments } from "./commandArguments";
import ContractDetector from "../fileDetectors/contractDetector";
import IoHelpers from "../util/ioHelpers";
import JSONC from "../util/JSONC";
import posixPath from "../util/posixPath";
import WalletDetector from "../fileDetectors/walletDetector";
import workspaceFolder from "../util/workspaceFolder";

import { useWalletConnect } from "@cityofzion/wallet-connect-sdk-react";
import { useEffect } from "react";

import WcSdk from "@cityofzion/wallet-connect-sdk-core";

import SignClient from "@walletconnect/sign-client";

//added from https://github.com/CityOfZion/wallet-connect-sdk/blob/develop/packages/wallet-connect-sdk-react/README.md#handling-proposals-manually
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

export default class NeoCommands {
  static _extensionUri: vscode.Uri;
  //above added by Rob on 7/12/22
  static async contractDeploy(
    contractDetector: ContractDetector,
    walletDetector: WalletDetector,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments: CommandArguments
  ) {
    //Added by Rob 06/24/22
    /*   const walletConnectCtx = useWalletConnect();
    walletConnectCtx.connect(); */
    //Added by Rob 06/24/22

    const identifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select());
    if (!identifier) {
      return;
    }
    if (identifier.name === "Neo N3 MainNet") {
      vscode.window.showErrorMessage(
        "Contract Deployment to Neo N3 MainNet is not supported."
      );
      return;
    }
    const wallets = walletDetector.wallets;
    if (!wallets.length) {
      vscode.window.showErrorMessage(
        "No NEP-6 wallets were found in the current workspace."
      );
      return;
    }
    if (!Object.keys(contractDetector.contracts).length) {
      vscode.window.showErrorMessage(
        "No compiled contracts were found in the current workspace. A compiled contract (*.nef file) along with its manifest (*.manifest.json file) is required for deployment."
      );
      return;
    }
    const rpcUrl = await identifier.selectRpcUrl();
    if (!rpcUrl) {
      return;
    }
    const walletPath = await IoHelpers.multipleChoiceFiles(
      "Select a wallet for the deployment...",
      ...wallets.map((_) => _.path)
    );
    const wallet = wallets.find((_) => _.path === walletPath);
    if (!wallet) {
      return;
    }
    const walletAccounts = wallet.accounts;
    if (!walletAccounts.length) {
      return;
    }
    let account: neonCore.wallet.Account | undefined = walletAccounts[0];
    if (walletAccounts.length > 1) {
      const selectedAddress = await IoHelpers.multipleChoice(
        `Select an address from wallet ${path.basename(walletPath)}...`,
        ...walletAccounts.map((_) => _.address)
      );
      account = walletAccounts.find((_) => _.address === selectedAddress);
    }
    if (!account) {
      return;
    }
    try {
      await account.decrypt("");
    } catch (e) {
      const password = await IoHelpers.enterPassword(
        "Enter your wallet password"
      );
      if (!password) {
        return;
      }
      try {
        await account.decrypt(password);
      } catch (e) {
        vscode.window.showErrorMessage("Incorrect password");
        return;
      }
    }
    const contracts = contractDetector.contracts;
    const contractFile =
      commandArguments.path ||
      (await IoHelpers.multipleChoiceFiles(
        `Deploy contract using ${account.address} (from ${path.basename(
          walletPath
        )})`,
        ...Object.values(contracts).map((_) => _.absolutePathToNef)
      ));
    const contract = Object.values(contracts).find(
      (_) => _.absolutePathToNef === contractFile
    );
    if (!contract) {
      return;
    }
    let contractByteCode: Buffer;
    try {
      contractByteCode = await fs.promises.readFile(
        contract.absolutePathToNef,
        null
      );
    } catch (e) {
      vscode.window.showErrorMessage(
        `Could not read contract: ${contract.absolutePathToNef}`
      );
      return;
    }

    const rpcAddress = await identifier.selectRpcUrl();
    if (!rpcAddress) {
      return;
    }

    try {
      const manifestJson = contract.manifest;
      if (
        !manifestJson.abi ||
        !manifestJson.extra ||
        !manifestJson.groups ||
        !manifestJson.name ||
        !manifestJson.permissions ||
        !manifestJson.supportedstandards ||
        !manifestJson.trusts
      ) {
        throw Error("Could not deploy the contract as manifest was incomplete");
      }
      const manifest = neonCore.sc.ContractManifest.fromJson(
        manifestJson as unknown as neonCore.sc.ContractManifestJson
      );
      const result = await neonExperimental.deployContract(
        neonCore.sc.NEF.fromBuffer(contractByteCode),
        manifest,
        {
          networkMagic: neonCore.CONST.MAGIC_NUMBER.TestNet,
          rpcAddress,
          account,
        }
      );
      vscode.window.showInformationMessage(result);
    } catch (e) {
      vscode.window.showErrorMessage(
        /*  e.message || */ "Could not deploy contract: Unknown error"
      );
    }
  }

  static async createWallet() {
    const rootFolder = workspaceFolder();
    if (!rootFolder) {
      vscode.window.showErrorMessage(
        "Please open a folder in your Visual Studio Code workspace before creating a wallet"
      );
      return;
    }
    const walletFilesFolder = posixPath(rootFolder, "wallets");
    try {
      await fs.promises.mkdir(walletFilesFolder);
    } catch {}
    const account = new neonCore.wallet.Account(
      neonCore.wallet.generatePrivateKey()
    );
    account.label = "Default account";
    const walletName = await IoHelpers.enterString(
      "Enter a name for the wallet"
    );
    if (!walletName) {
      return;
    }
    const wallet = new neonCore.wallet.Wallet({ name: walletName });
    wallet.addAccount(account);
    wallet.setDefault(0);
    const password = await IoHelpers.choosePassword(
      "Choose a password for the wallet (press Enter for none)",
      true
    );
    if (!password && password !== "") {
      return;
    }
    if (!(await wallet.encryptAll(password))) {
      vscode.window.showErrorMessage(
        "Could not encrypt the wallet using the supplied password"
      );
    }
    const walletJson = JSONC.stringify(wallet.export());
    const safeWalletName = walletName.replace(/[^-_.a-z0-9]/gi, "-");
    let filename = posixPath(
      walletFilesFolder,
      `${safeWalletName}.neo-wallet.json`
    );
    let i = 0;
    while (fs.existsSync(filename)) {
      i++;
      filename = posixPath(
        walletFilesFolder,
        `${safeWalletName} (${i}).neo-wallet.json`
      );
    }
    await fs.promises.writeFile(filename, walletJson);
    await vscode.commands.executeCommand(
      "vscode.open",
      vscode.Uri.file(filename)
    );
  }

  static async invokeContract(
    activeConnection: ActiveConnection,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments?: CommandArguments
  ) {
    const identifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select());
    if (!identifier) {
      return;
    }
    if (
      activeConnection.connection?.blockchainIdentifier.name !== identifier.name
    ) {
      await activeConnection.connect(identifier);
    }
    const rootFolder = workspaceFolder();
    if (!rootFolder) {
      vscode.window.showErrorMessage(
        "Please open a folder in your Visual Studio Code workspace before invoking a contract"
      );
      return;
    }
    const invokeFilesFolder = posixPath(rootFolder, "invoke-files");
    try {
      await fs.promises.mkdir(invokeFilesFolder);
    } catch {}
    let filename = posixPath(invokeFilesFolder, "Untitled.neo-invoke.json");
    let i = 0;
    while (fs.existsSync(filename)) {
      i++;
      filename = posixPath(
        invokeFilesFolder,
        `Untitled (${i}).neo-invoke.json`
      );
    }
    await fs.promises.writeFile(filename, "[{}]");
    await vscode.commands.executeCommand(
      "vscode.open",
      vscode.Uri.file(filename)
    );
  }

  //added 6/22/22-Rob
  public static async connectWallet() {
    let wcSdk = new WcSdk(
      await SignClient.init({
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
  }
  //

  /*   const wallet = connectWallet();
   
  static async getWebviewContent() {
     const wcOptions = class {
      chains: ["neo3:testnet", "neo3:mainnet"] | undefined; // the blockchains your dapp accepts to connect
      logger: "debug" | undefined; // use debug to show all log information on browser console
      methods: ["invokeFunction"] | undefined; // which RPC methods do you plan to call
      relayServer: "wss://relay.walletconnect.org" | undefined; // we are using walletconnect's official relay server,
      qrCodeModal: true | undefined; // to show a QRCode modal when connecting. Another option would be to listen to proposal event and handle it manually, described later
      appMetadata:
        | {
            name: "MyApplicationName"; // your application name to be displayed on the wallet
            description: "My Application description"; // description to be shown on the wallet
            url: "https://myapplicationdescription.app/"; // url to be linked on the wallet
            icons: ["https://myapplicationdescription.app/myappicon.png"]; // icon to be shown on the wallet
          }
        | undefined;
    }; 

    const nonce = getNonce();

    function getNonce() {
      let text = "hello!!";
      const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    }
    
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, "main.js");

    const scriptUri = webview.asWebviewUri(scriptPathOnDisk); 

    let count: any = 0;
    const harry = harold(count);

    function harold(count: any) {
      // Handle the message inside the webview
    }

    return `<!DOCTYPE html>
  <html lang="en">
  <WalletConnectContextProvider options={wcOptions}>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cat Coding</title>
  </head>
  <body>
         

      <br>
      <br>
      <br>
      <script nonce="${getNonce}" >
      
      
      </script>
      
    

      <br>
      <br>
      <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
      <h1 id="lines-of-code-counter">0</h1>
      <h1 id="lines-of-code-counter">0</h1>

      <script> 
      const counter: any = document.getElementById("lines-of-code-counter");

      window.addEventListener("message", (event) => {
        const message = event.data; // The JSON data our extension sent

        switch (message.command) {
          case "refactor":
            count = Math.ceil(count * 0.5);
            counter.textContent = count;
            break;
        }
      });
      
      let count = 0;
      setInterval(() => {
        counter.textContent = count++;
      }, 100);            
      ${harry}          
               
      </script>
      
      <h1 id="butter">5</h1>

      <script>

      const counter0 = document.getElementById('butter');

      const walletConnectCtx = useWalletConnect();
      if (walletConnectCtx.uri.length) {
        let text0 = walletConnectCtx.uri;
    }
      
    

      setInterval(() => {
        counter0.textContent = text0;
    });
 
      </script>

      <script>

      const wcInstance = new WcSdk();

      wcInstance.initClient(
        "debug", // logger: use 'debug' to show all log information on browser console, use 'error' to show only errors
        "wss://relay.walletconnect.org" // we are using walletconnect's official relay server
      );

      wcInstance.connect({
        chains: ["neo3:testnet", "neo3:mainnet"], // the blockchains your dapp accepts to connect
        methods: [ // which RPC methods do you plan to call
          "invokeFunction",
          "testInvoke",
          "signMessage",
          "verifyMessage"
        ],
        appMetadata: {
          name: "MyApplicationName", // your application name to be displayed on the wallet
          description: "My Application description", // description to be shown on the wallet
          url: "https://myapplicationdescription.app/", // url to be linked on the wallet
          icons: ["https://myapplicationdescription.app/myappicon.png"], // icon to be shown on the wallet
        }
      })

      console.log(wcInstance.session ? 'Connected successfully' : 'Connection refused')

      </script>

      <br>

     <br>

     
      <br>

    
      <iframe width="100%" height=800 src='https://algorand.github.io/walletconnect-example-dapp/'> </iframe>
      <link rel="stylesheet" type="text/css" options={wcOptions} href="https://neon.coz.io/connect?uri=$%7BwalletConnectCtx.uri%7D">
      
      </body>       
      </WalletConnectContextProvider>
 
  </html>`;
  }

  */
}
