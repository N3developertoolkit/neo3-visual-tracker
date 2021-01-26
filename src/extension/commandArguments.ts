import BlockchainIdentifier from "./blockchainIdentifier";

//
// Represents all possible arguments to any command explosed by
// the extension.
//
// All values are optional, and will be solicited from the user by
// the command implementation if required but undefined.
//
type CommandArguments = {
  blockchainIdentifier?: BlockchainIdentifier;
  path?: string;
  secondsPerBlock?: number;
};

async function sanitizeCommandArguments(input: any): Promise<CommandArguments> {
  return {
    blockchainIdentifier: undefined, // TODO: Allow blockchain to be specified in command URIs
    path: undefined, // TODO: Allow specification of path in command URIs (ensure supplied path is within the workspace though)
    secondsPerBlock: parseInt(input.secondsPerBlock) || undefined,
  };
}

export { CommandArguments, sanitizeCommandArguments };
