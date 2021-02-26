type Language = {
  displayName: string;
};

type LanguageCode = "csharp" | "java";

const languages: { [code in LanguageCode]: Language } = {
  csharp: { displayName: "C#" },
  java: { displayName: "Java" },
};

export { Language, LanguageCode, languages };
