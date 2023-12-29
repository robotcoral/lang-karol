/* eslint-disable unicorn/filename-case */

import { KarolLanguageSupport } from "./lang/lang";
import { GermanLanguageSupport } from "./lang/de";
import * as tokens from "./karol.terms";

const tokenMap: Map<string, number> = new Map(Object.entries(tokens));

function generateTokenizer(langSupport: KarolLanguageSupport) {
  return (str: string) => {
    for (const [key, value] of Object.entries(langSupport.keywords)) {
      if (value.test(str) && tokenMap.has(key)) {
        return tokenMap.get(key);
      }
    }
    for (const [, value] of Object.entries(langSupport.colours)) {
      if (value === str) {
        return tokens.Colour;
      }
    }
    return -1;
  };
}

export const germanTokenizer = generateTokenizer(GermanLanguageSupport);
