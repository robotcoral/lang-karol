export type TreeNode =
	| {
			kind: "statements";
			statements: [TreeNode];
	  }
	| {
			kind: "statement";
			identifier: string;
			line: number;
	  }
	| {
			kind: "statementWithParam";
			identifier: string;
			param: string;
			line: number;
	  }
	| {
			kind: "subroutine";
			identifier: string;
			body: [TreeNode];
			line: number;
	  }
	| {
			kind: "condition";
			identifier: string;
			body: [TreeNode];
			line: number;
	  }
	| {
			kind: "if";
			inverted: boolean;
			condition: Node;
			body: [TreeNode];
			line: number;
	  }
	| {
			kind: "ifElse";
			inverted: boolean;
			condition: Node;
			body: [TreeNode];
			elseBody: [TreeNode];
			line: number;
	  }
	| {
			kind: "whileForever";
			body: [TreeNode];
			line: number;
	  }
	| {
			kind: "whileTimes";
			times: number;
			body: [TreeNode];
			line: number;
	  }
	| {
			kind: "while";
			inverted: boolean;
			condition: TreeNode;
			body: [TreeNode];
			line: number;
	  }
	| {
			kind: "whileEnd";
			inverted: boolean;
			condition: TreeNode;
			body: [TreeNode];
			line: number;
	  }
	| {
			kind: "untilEnd";
			inverted: boolean;
			condition: TreeNode;
			body: [TreeNode];
			line: number;
	  };

export type KarolProgram = {
	start: TreeNode;
	subroutines: [TreeNode];
	conditions: [TreeNode];
};

export type CompilerResult =
	| { kind: "success"; result: KarolProgram }
	| { kind: "error"; msg: string; line: number };
