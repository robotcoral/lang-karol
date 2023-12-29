import { KarolLanguageSupport } from "./lang";

export const GermanLanguageSupport: KarolLanguageSupport = {
  keywords: {
    beginSubroutine: /^(anweisung|methode)$/i,
    endSubroutine: /^((ende|\*)(anweisung|methode))$/i,
    beginCondition: /^(bedingung)$/i,
    endCondition: /^((ende|\*)bedingung)$/i,
    beginIf: /^(wenn)$/i,
    // eslint-disable-next-line unicorn/no-thenable
    then: /^(dann)$/i,
    beginElse: /^(sonst)$/i,
    endIf: /^((ende|\*)wenn)$/i,
    beginWhile: /^(wiederhole)$/i,
    endWhile: /^((ende|\*)wiederhole)$/i,
    forever: /^(immer)$/i,
    times: /^(mal)$/i,
    doWhile: /^(solange)$/i,
    until: /^(bis)$/i,
    not: /^(nicht)$/i,
  },
  colours: {
    red: "rot",
    green: "grün",
    blue: "blau",
    yellow: "gelb",
    black: "schwarz",
  },
};
