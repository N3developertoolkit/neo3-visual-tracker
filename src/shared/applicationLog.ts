type TypedValue = {
  type: string;
  value?: TypedValue[] | string;
};

type ApplicationLog = {
  txid?: string;
  executions?: Partial<{
    trigger: string;
    vmstate: string;
    gasconsumed: string;
    stack: any[];
    notifications: Partial<{
      contract: string;
      eventname: string;
      state: TypedValue;
    }>[];
  }>[];
};

export default ApplicationLog;
