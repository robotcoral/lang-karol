import { Position } from "./compiler_types";

export class CompilerError {
    pos: Position;
    msg: String;
    constructor(pos: Position, msg: String) {
        this.pos = pos;
        this.msg = msg;
    }
    get getPosition() {
        return this.pos;
    }
    get getMessage() {
        return this.msg;
    }
}

export class NoParamAllowedError extends CompilerError {
    constructor(pos: Position, subName: String) {
        super(pos, `call to ${subName} must not contain parameters`);
    }
}

export class PredefinedSubRedefinitionError extends CompilerError {
    constructor(pos: Position, subName: String) {
        super(pos, `${subName} is predefined`);
    }
}

export class NestedSubDefintionError extends CompilerError {
    constructor(pos: Position, subName: String) {
        super(pos, `${subName} must not be defined inside another definition`);
    }
}

export class IllegalRedefinitionError extends CompilerError {
    constructor(pos: Position, subName: String) {
        super(pos, `illegal redefintion of ${subName}`);
    }
}

export class UndefinedCallError extends CompilerError {
    constructor(pos: Position, subName: String) {
        super(pos, `${subName} is undefined`);
    }
}

export class NoConditionError extends CompilerError {
    constructor(pos: Position, subName: String) {
        super(pos, `${subName} is not a condition`);
    }
}