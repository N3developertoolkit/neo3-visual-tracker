type VariableDeclaration = {
  prompt?: string;
  eval?: (existingVariableValues: { [key: string]: string }) => Promise<string>;
  parse?: (value: string | undefined) => Promise<string | undefined>;
};

type Language = {
  displayName: string;
  variables: { [variableName: string]: VariableDeclaration } & {
    [variableName in "CONTRACTNAME"]: VariableDeclaration;
  };
};

type LanguageCode = "csharp" | "java";

const languages: { [code in LanguageCode]: Language } = {
  csharp: {
    displayName: "C#",
    variables: {
      CONTRACTNAME: {
        prompt: "Enter name for your contract (e.g. TokenEscrow)",
        parse: async (contractName) => {
          if (contractName?.toLocaleLowerCase().endsWith("contract")) {
            contractName = contractName.replace(/contract$/i, "");
          }
          if (!contractName) {
            return undefined;
          }
          if (!contractName[0].match(/[a-z]/i)) {
            contractName = "_" + contractName;
          }
          return contractName.replace(/[^a-z0-9]+/gi, "_") || undefined;
        },
      },
      CLASSNAME: { eval: async ($) => $["$_CONTRACTNAME_$"] + "Contract" },
    },
  },
  java: {
    displayName: "Java",
    variables: {
      CONTRACTNAME: {
        prompt: "Enter name for your contract (e.g. TokenEscrow)",
        parse: async (contractName) => {
          if (contractName?.toLocaleLowerCase().endsWith("contract")) {
            contractName = contractName.replace(/contract$/i, "");
          }
          if (!contractName) {
            return undefined;
          }
          if (!contractName[0].match(/[a-z]/i)) {
            contractName = "_" + contractName;
          }
          return contractName.replace(/[^a-z0-9]+/gi, "_") || undefined;
        },
      },
      CLASSNAME: { eval: async ($) => `${$["$_CONTRACTNAME_$"]}Contract` },
      REVERSEDOMAINNAME: {
        prompt: "Enter a package name (e.g. com.yourdomain)",
      },
      REVERSEDOMAINNAMEPATH: {
        eval: async ($) => $["$_REVERSEDOMAINNAME_$"].replaceAll(".", "//"),
      },
    },
  },
};

export { Language, LanguageCode, languages };
