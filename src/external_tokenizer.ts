import { KarolLanguageSupport } from "lang/lang";
import { GermanLanguageSupport } from "lang/de";
import * as tokens from "karol.terms";

const tokenMap: Map<string, number> = new Map(Object.entries(tokens));

function generateTokenizer(langSupport: KarolLanguageSupport) {
    return (str: string) => {
        for (const [key, value] of Object.entries(GermanLanguageSupport.keywords))
            if(value.test(str))
                if(tokenMap.has(key))
                    return tokenMap.get(key);
        for (const [key, value] of Object.entries(GermanLanguageSupport.colours))
            if(value === str)
                return tokens.Colour;
        return -1;
    }
}

export const germanTokenizer = generateTokenizer(GermanLanguageSupport);