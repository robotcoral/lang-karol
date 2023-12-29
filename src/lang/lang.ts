export type KarolLanguageSupport = {
  keywords: {
    beginSubroutine: RegExp;
    endSubroutine: RegExp;
    beginCondition: RegExp;
    endCondition: RegExp;
    beginIf: RegExp;
    then: RegExp;
    beginElse: RegExp;
    endIf: RegExp;
    beginWhile: RegExp;
    endWhile: RegExp;
    forever: RegExp;
    times: RegExp;
    doWhile: RegExp;
    until: RegExp;
    not: RegExp;
  };
  colours: {
    red: string;
    green: string;
    blue: string;
    yellow: string;
    black: string;
  };
};
