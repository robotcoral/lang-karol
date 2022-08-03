import { Position } from "./compiler_types";

export class CompilerError extends Error {
	constructor(public msg: string, public pos: Position) {
		super(msg);
		this.name = this.constructor.name;
	}
}

export const CompilerErrorMessages = {
	noParamAllowed: "subroutine/condition calls must not contain parameters",
	predefinedSubRedefinition: "redefinition of predefined subroutine",
	predefinedCondRedefinition: "redefinition of predefined condition",
	nestedSubDefintion:
		"subroutine must not be declared inside another subroutine/condition declaration",
	nestedCondDefintion:
		"condition must not be declared inside another subroutine/condition declaration",
	illegalRedefinition: "illegal redefintion",
	parseError: "parse error",
};
