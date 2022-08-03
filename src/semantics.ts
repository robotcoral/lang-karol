import { TreeCursor } from "@lezer/common";
import { CompilerError } from "./compiler_errors";
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

function posFromCursor(cursor: TreeCursor): Position {
	return { from: cursor.from, to: cursor.to };
}

function validateIdentifier(
	str: string,
	conditions: Set<string>,
	subroutines: Set<string>,
	cursor: TreeCursor
): void {
	let val: string = getVal(str, cursor);

	if (
		!conditions.has(val) &&
		!subroutines.has(val) &&
		!conditionIdentifiersSet.has(val) &&
		!callIdentifiersSet.has(val) &&
		val !== "wahr" &&
		val !== "falsch"
	) {
		throw new CompilerError(
			"unknownSubroutineOrCondition",
			posFromCursor(cursor)
		);
	}
}

function validateIf(
	str: string,
	conditions: Set<string>,
	cursor: TreeCursor
): void {
	cursor.firstChild();
	cursor.nextSibling();
	let val = getVal(str, cursor);
	if (val === "nicht") cursor.nextSibling();
	if (cursor.name === "IdentifierWithParam") {
		cursor.firstChild();
		val = getVal(str, cursor);
		cursor.parent();
	} else {
		val = getVal(str, cursor);
	}
	if (!conditions.has(val) && !conditionIdentifiersSet.has(val)) {
		throw new CompilerError("identifierMustBeCondition", posFromCursor(cursor));
	}
	cursor.parent();
}

function validateWhile(
	str: string,
	conditions: Set<string>,
	cursor: TreeCursor
): void {
	cursor.firstChild(); // wiederhole
	cursor.nextSibling(); // "immer" | "solange" | Number
	let val = getVal(str, cursor);
	if (val === "immer" || cursor.name === "Number") {
		// skip times and forever loops
		cursor.parent();
		return;
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
		throw new CompilerError("identifierMustBeCondition", posFromCursor(cursor));
	}
	cursor.parent();
}

function validateWhileEnd(
	str: string,
	conditions: Set<string>,
	cursor: TreeCursor
): void {
	cursor.firstChild(); // "wiederhole"
	let val = getVal(str, cursor);
	while (cursor.nextSibling()) {
		val = getVal(str, cursor);
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
		throw new CompilerError("identifierMustBeCondition", posFromCursor(cursor));
	}
	cursor.parent();
}

export function semanticAnalysis(
	str: string,
	cursor: TreeCursor,
	conditions: Set<string>,
	subroutines: Set<string>
): void {
	do {
		let lit = cursor.name;
		switch (lit) {
			case "Identifier":
				validateIdentifier(str, conditions, subroutines, cursor);
				break;
			case "IdentifierWithParam":
				break;
			case "If":
				validateIf(str, conditions, cursor);
				break;
			case "While":
				validateWhile(str, conditions, cursor);
				break;
			case "WhileEnd":
				validateWhileEnd(str, conditions, cursor);
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
				throw new CompilerError("parseError", posFromCursor(cursor));
		}
	} while (cursor.next());
}
