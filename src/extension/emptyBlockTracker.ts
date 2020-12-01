import * as neonCore from "@cityofzion/neon-core";

const LOG_PREFIX = "[EmptyBlockTracker]";
const REFRESH_INTERVAL_MS = 1000 * 5; // check for new blocks every 5 seconds

export default class EmptyBlockTracker {
  private disposed: boolean;
  private rpcId: number;

  constructor(private readonly rpcClient: neonCore.rpc.RPCClient) {
    this.disposed = false;
    this.rpcId = 0;
    this.refreshLoop();
  }

  dispose() {
    this.disposed = true;
  }

  private async refreshLoop() {
    if (this.disposed) {
      return;
    }
    try {
      await this.updateState();
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }

  private async updateState() {
    try {
      const count = 150; // return this many results
      const start = 100; // counting backwards from this block number
      const result = await this.rpcClient.query({
        method: "expressgetpopulatedblocks",
        params: [count, start],
        id: this.rpcId++,
        jsonrpc: "2.0",
      });
      console.log(LOG_PREFIX, "Empty blocks", result);
    } catch (e) {
      console.error(LOG_PREFIX, "Could not get empty blocks", e.message);
    }
  }
}
