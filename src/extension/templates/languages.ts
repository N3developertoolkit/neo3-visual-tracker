type VariableDeclaration = {
  prompt?: string;
  eval?: (existingVariableValues: { [key: string]: string }) => Promise<string>;
  parse?: (value: string | undefined) => Promise<string | undefined>;
};

type Language = {
  variables: { [variableName: string]: VariableDeclaration } & {
    [variableName in "CONTRACTNAME"]: VariableDeclaration;
  };
  tasks?: {
    label: string;
    dependsOnLabel?: string;
    group: string;
    type: string;
    command: string;
    args: string[];
    problemMatcher: string | any[];
    autoRun?: boolean;
  }[];
};

const languages: { [code: string]: Language } = {
  csharp: {
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
      MAINFILE: { eval: async ($) => $["$_CONTRACTNAME_$"] + "Contract.cs" },
    },
    tasks: [
      {
        label: "restore",
        group: "build",
        type: "shell",
        command: "dotnet",
        args: ["restore"],
        problemMatcher: [],
      },
      {
        label: "build",
        dependsOnLabel: "restore",
        group: "build",
        type: "shell",
        command: "dotnet",
        args: [
          "build",
          "/property:GenerateFullPaths=true",
          "/consoleloggerparameters:NoSummary",
        ],
        problemMatcher: "$msCompile",
        autoRun: true,
      },
    ],
  },
  java: {
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
      MAINFILE: {
        eval: async ($) =>
          `src/main/java/${$["$_REVERSEDOMAINNAMEPATH_$"]}/${$["$_CLASSNAME_$"]}.java`,
      },
    },
  },
};

export { Language, languages };
