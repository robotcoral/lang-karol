import {parser} from "./syntax.grammar"
import {LezerLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {styleTags, tags as t} from "@codemirror/highlight"

export const EXAMPLELanguage = LezerLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Identifier: t.variableName,
        Colour: t.literal,
        Number: t.number,
        comment: t.blockComment,
        Keyword: t.keyword,
        "( )": t.paren
      })
    ]
  }),
  languageData: {
    commentTokens: {block: {open: "{", close: "}"}}
  }
})

export function EXAMPLE() {
  return new LanguageSupport(EXAMPLELanguage)
}
