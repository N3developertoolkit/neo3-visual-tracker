import BlockchainMonitor from "./blockchainMonitor";

export default class BlockchainMonitorPool {
  private readonly monitors: {
    [rpcUrl: string]: { refCount: number; ref: BlockchainMonitor } | undefined;
  };

  constructor() {
    this.monitors = {};
  }

  getMonitor(rpcUrl: string) {
    let monitorRef = this.monitors[rpcUrl] || {
      refCount: 0,
      ref: BlockchainMonitor.createForPool(rpcUrl, () => {
        monitorRef.refCount--;
        if (monitorRef.refCount <= 0) {
          this.monitors[rpcUrl] = undefined;
          monitorRef.ref.dispose(true);
        }
      }),
    };
    monitorRef.refCount++;
    this.monitors[rpcUrl] = monitorRef;
    return monitorRef.ref;
  }
}
