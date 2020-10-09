import * as fs from "fs";
import * as neonCore from "@cityofzion/neon-core";

const LOG_PREFIX = "[Wallet]";

export default class Wallet {
  static fromJsonFile(path: string): Wallet | undefined {
    try {
      const json = JSON.parse(fs.readFileSync(path).toString());
      if (
        json.name === undefined ||
        json.version === undefined ||
        json.scrypt === undefined ||
        json.accounts === undefined
      ) {
        // Probably not a wallet
        return undefined;
      }
      return new Wallet(new neonCore.wallet.Wallet(json));
    } catch (e) {
      console.log(LOG_PREFIX, "Not a wallet", e.message, path);
      return undefined;
    }
  }

  constructor(private readonly wallet: neonCore.wallet.Wallet) {}
}
