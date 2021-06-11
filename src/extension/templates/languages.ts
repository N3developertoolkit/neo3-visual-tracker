import tryFetchJson from "../util/tryFetchJson";

// Variable resolution procedure:
// i)   The `eval` function is called (if-present) and its result is used as the
//      variable value.
// ii)  If a `prompt` is provided the user is allowed to optionally specify a
//      value (which will overwrite the result of `eval`, if any)
// iii) If a `parse` function is present it will be called and can modify the
//      user-provided value.
// After the above steps, the variable value must be non-empty or template hydration
// will not proceed.
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
  settings?: { [settingName: string]: string };
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
      MAINFILE: {
        eval: async ($) => "src/" + $["$_CONTRACTNAME_$"] + "Contract.cs",
      },
    },
    tasks: [
      {
        label: "build",
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
    settings: { "dotnet-test-explorer.testProjectPath": "**/*Tests.csproj" },
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
      NEOW3JLIBVERSION: {
        eval: async () => {
          // Attempt to get the latest neow3j from Maven Central (falling back to
          // a hard-coded version if Maven Central is not available or returns a
          // malformed response):
          const FALLBACK = "3.8.0";
          const searchResults = await tryFetchJson(
            "https",
            "search.maven.org",
            `/solrsearch/select?q=g:"io.neow3j"+AND+a:"core"`
          );
          return (
            (searchResults.response?.docs || [])[0]?.latestVersion
              ?.replace(/[^.a-z0-9]/gi, "")
              ?.trim() || FALLBACK
          );
        },
        prompt: "Which version of neow3j would you like to target?",
        parse: (_) => Promise.resolve(_?.replace(/[^.a-z0-9]/gi, "").trim()),
      },
    },
  },
};

export { Language, languages };
