import { KarolLanguageSupport } from "lang/lang";

export const GermanLanguageSupport: KarolLanguageSupport = {
    keywords: {
        beginSubroutine: /^(Anweisung|Methode)$/i,
        endSubroutine: /^((ende|\*)(Anweisung|Methode))$/i,
        beginCondition: /^(Bedingung)$/i,
        endCondition: /^((ende|\*)Bedingung)$/i,
        beginIf: /^(wenn)$/i,
        then: /^(dann)$/i,
        beginElse: /^(sonst)$/i,
        endIf: /^((ende|\*)wenn)$/i,
        beginWhile: /^(wiederhole)$/i,
        endWhile: /^((ende|\*)wiederhole)$/i,
        forever: /^(immer)$/i,
        times: /^(mal)$/i,
        doWhile: /^(solange)$/i,
        until: /^(bis)$/i,
        not: /^(nicht)$/i
    },
    colours: {
        red: "rot",
        green: "grün",
        blue: "blau",
        yellow: "gelb",
        black: "schwarz"
    }
}