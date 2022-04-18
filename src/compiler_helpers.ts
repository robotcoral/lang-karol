import { TreeCursor } from "@lezer/common";
import { conditionIdentifiersSet, callIdentifiersSet, DefinitionCompilationResult, Position, TreeData } from ".";

export function getPos(data: TreeData): Position {
    return { from: data.cursor.from, to: data.cursor.to };
}

export function getVal(data: TreeData): string {
    return data.str.substring(data.cursor.from, data.cursor.to);
}

export function isSub(data: TreeData) {
    return data.cursor.name === "Subroutine" || data.cursor.name === "Condition";
}

export function isPredefinedIdentifier(val: string) {
    return callIdentifiersSet.has(val) || conditionIdentifiersSet.has(val);
}

export function isBool(val: string) {
    return val === "wahr" || val === "falsch";
}

/*export function isEnde(token: string, val: string) {
    return val === `ende${token}` || val === `*${token}`;
}*/

export function isNotRedefined(subroutines: Set<string>, conditions: Set<string>, defRes: DefinitionCompilationResult) {
    return !subroutines.has(defRes.identifier) && !conditions.has(defRes.identifier);
}