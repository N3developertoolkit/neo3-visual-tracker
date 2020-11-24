import * as fs from "fs";
import * as neonCore from "@cityofzion/neon-core";

import JSONC from "./util/JSONC";

const LOG_PREFIX = "[Wallet]";

export default class Wallet {
  static async fromJsonFile(path: string): Promise<Wallet | undefined> {
    try {
      const json = JSONC.parse(fs.readFileSync(path).toString());
      if (
        json.name === undefined ||
        json.version === undefined ||
        json.scrypt === undefined ||
        json.accounts === undefined
      ) {
        // Probably not a wallet
        return undefined;
      }
      const result = new Wallet(path, new neonCore.wallet.Wallet(json));
      await result.tryUnlockWithoutPassword();
      return result;
    } catch (e) {
      console.log(LOG_PREFIX, "Not a wallet", e.message, path);
      return undefined;
    }
  }

  constructor(
    public readonly path: string,
    private readonly wallet: neonCore.wallet.Wallet
  ) {}

  get addresses() {
    return this.wallet.accounts.map((_) => _.address);
  }

  async tryUnlockWithoutPassword() {
    for (let i = 0; i < this.wallet.accounts.length; i++) {
      try {
        if (await this.wallet.decrypt(i, "")) {
          console.log(
            LOG_PREFIX,
            this.wallet.name,
            "Unlocked account without password:",
            this.wallet.accounts[i].label
          );
        } else {
          console.log(
            LOG_PREFIX,
            this.wallet.name,
            "Account is password protected:",
            this.wallet.accounts[i].label
          );
        }
      } catch (e) {
        // TODO: Current version of neonCore package will not decrypt
        //       Neo 2 wallets. Surface a more useful error in this case.
        console.log(
          LOG_PREFIX,
          this.wallet.name,
          "Unexpected error decrypting account",
          this.wallet.accounts[i].label,
          e.message
        );
      }
    }
  }
}
