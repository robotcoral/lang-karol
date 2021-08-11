import { styleTags, tags as t } from "@codemirror/highlight";
import { LanguageSupport, LezerLanguage } from "@codemirror/language";
import { CompilerResult } from "./compiler_types";
import { parser } from "./syntax.grammar";

export const karolLanguage = LezerLanguage.define({
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

export function compile(str: string): CompilerResult {
	let cursor = parser.parse(str).cursor();
	do {
		console.log(
			`Node ${cursor.name} from ${cursor.from} to ${
				cursor.to
			} => ${str.substring(cursor.from, cursor.to)}`
		);
	} while (cursor.next());
	return { kind: "error", msg: "not implemented yet", line: 0 };
}

export function parse(str: string) {
	return parser.parse(str);
}
