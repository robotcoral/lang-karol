import { Position } from "./compiler_types";

export class CompilerError extends Error {
	constructor(
		public code: keyof typeof CompilerErrorMessages,
		public pos: Position
	) {
		super(CompilerErrorMessages[code]);
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
	unknownSubroutineOrCondition: "unknown subroutine/condition",
	identifierMustBeCondition: "identifier must be a condition",
};
