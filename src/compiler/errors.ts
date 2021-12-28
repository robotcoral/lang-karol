import { Position } from "compiler/types";

export function noParamAllowed(pos: Position) {
    return {
        msg: "subroutine/condition calls must not contain parameters",
        pos: pos,
    };
}

export function predefinedSubRedefinition(pos: Position) {
    return {
        msg: "redefinition of predefined subroutine",
        pos: pos,
    };
}

export function predefinedCondRedefinition(pos: Position) {
    return {
        msg: "redefinition of predefined condition",
        pos: pos,
    };
}

export function nestedSubDefintion(pos: Position) {
    return {
        msg: "subroutine must not be declared inside another subroutine/condition declaration",
        pos: pos,
    };
}

export function nestedCondDefintion(pos: Position) {
    return {
        msg: "condition must not be declared inside another subroutine/condition declaration",
        pos: pos,
    };
}

export function illegalRedefinition(pos: Position) {
    return {
        msg: "illegal redefintion",
        pos: pos,
    };
}