import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { Tree } from "@lezer/common";
import { parser } from "./karol";

export const karolLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Identifier: t.variableName,
        Colour: t.literal,
        Number: t.number,
        comment: t.blockComment,
        Keyword: t.keyword,
        "( )": t.paren,
      }),
    ],
  }),
  languageData: {
    commentTokens: { block: { open: "{", close: "}" } },
  },
});

export function karol() {
  return new LanguageSupport(karolLanguage);
}

export function parse(str: string): Tree {
  return parser.parse(str);
}
