import { TreeCursor } from "@lezer/common";
import {
	callIdentifiers,
	conditionIdentifiers,
	Position,
} from "./compiler_types";

export const callIdentifiersSet = new Set(callIdentifiers);
export const conditionIdentifiersSet = new Set(conditionIdentifiers);

export function getVal(str: string, cursor: TreeCursor): string {
	return str.substring(cursor.from, cursor.to);
}

export function semanticAnalysis(
	str: string,
	cursor: TreeCursor,
	conditions: Set<string>,
	subroutines: Set<string>
): void {
	do {
		let val: string = getVal(str, cursor);
		let pos: Position = { from: cursor.from, to: cursor.to };
		let lit = cursor.name;
		switch (lit) {
			case "Identifier":
				if (
					!conditions.has(val) &&
					!subroutines.has(val) &&
					!conditionIdentifiersSet.has(val) &&
					!callIdentifiersSet.has(val) &&
					val !== "wahr" &&
					val !== "falsch"
				) {
					throw {
						msg: "unknown subroutine/condition",
						pos: { from: cursor.from, to: cursor.to },
					};
				}
				break;
			case "IdentifierWithParam":
				break;
			case "If":
				cursor.firstChild();
				cursor.nextSibling();
				val = getVal(str, cursor);
				if (val === "nicht") cursor.nextSibling();
				if (cursor.name === "IdentifierWithParam") {
					cursor.firstChild();
					val = getVal(str, cursor);
					cursor.parent();
				} else {
					val = getVal(str, cursor);
				}
				if (!conditions.has(val) && !conditionIdentifiersSet.has(val)) {
					throw {
						msg: "identifier must be a condition",
						pos: { from: cursor.from, to: cursor.to },
					};
				}
				cursor.parent();
				break;
			case "While":
				cursor.firstChild(); // wiederhole
				cursor.nextSibling(); // "immer" | "solange" | Number
				val = getVal(str, cursor);
				if (val === "immer" || cursor.name === "Number") {
					// skip times and forever loops
					cursor.parent();
					break;
				}
				cursor.nextSibling();
				if (getVal(str, cursor) === "nicht") cursor.nextSibling();
				if (cursor.name === "IdentifierWithParam") {
					cursor.firstChild();
					val = getVal(str, cursor);
					cursor.parent();
				} else {
					val = getVal(str, cursor);
				}
				if (!conditions.has(val) && !conditionIdentifiersSet.has(val)) {
					throw {
						msg: "identifier must be a condition",
						pos: { from: cursor.from, to: cursor.to },
					};
				}
				cursor.parent();
				break;
			case "WhileEnd":
				cursor.firstChild(); // "wiederhole"
				while (cursor.nextSibling()) {
					let val = getVal(str, cursor);
					if (val === "endewiederhole" || val === "*wiederhole") break;
				}
				cursor.nextSibling(); // "solange" | "bis"
				cursor.nextSibling();
				if (getVal(str, cursor) === "nicht") {
					cursor.nextSibling();
				}
				if (cursor.name === "IdentifierWithParam") {
					cursor.firstChild();
					val = getVal(str, cursor);
					cursor.parent();
				} else {
					val = getVal(str, cursor);
				}
				if (!conditions.has(val) && !conditionIdentifiersSet.has(val)) {
					throw {
						msg: "identifier must be a condition",
						pos: { from: cursor.from, to: cursor.to },
					};
				}
				cursor.parent();
				break;
			case "Subroutine":
				break;
			case "Condition":
				break;
			case "Keyword":
				break;
			case "Number":
				break;
			case "Colour":
				break;
			case "(":
				break;
			case ")":
				break;
			default:
				// faulty node detected -> parser error
				throw { msg: "parse error", pos: pos };
		}
	} while (cursor.next());
}
