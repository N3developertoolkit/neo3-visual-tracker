type StorageExplorerViewState = {
  contracts: string[];
  error: string | null;
  panelTitle: string;
  selectedContract: string | null;
  storage: { key?: string; value?: string; constant?: boolean }[];
  view: "storageExplorer";
};

export default StorageExplorerViewState;
