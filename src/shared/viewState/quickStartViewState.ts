type QuickStartViewState = {
  view: "quickStart";
  panelTitle: "";
  connectionName: string | null;
  hasContracts: boolean;
  hasNeoExpressInstance: boolean;
  neoDeploymentRequired: boolean;
  neoExpressDeploymentRequired: boolean;
  neoExpressIsRunning: boolean;
  workspaceIsOpen: boolean;
};

export default QuickStartViewState;
