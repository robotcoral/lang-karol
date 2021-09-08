import { styleTags, tags as t } from "@codemirror/highlight";
import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { TreeCursor } from "@lezer/common";
import {
  callIdentifiers,
  CompilationResult,
  conditionIdentifiers,
  DefinitionCompilationResult,
  InnerCompilationResult,
  Position,
} from "./compiler_types";
import { parser } from "./syntax.grammar";

// TODO: check if condition will always return true or false
// FIXME: remove * as its own token and add it to the keyword => needs to be fixed inside the grammar

export const karolLanguage = LRLanguage.define({
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

export function parse(str: string) {
  return parser.parse(str);
}

function getVal(str: string, cursor: TreeCursor): string {
  return str.substring(cursor.from, cursor.to);
}

function compileIdentifier(
  str: string,
  cursor: TreeCursor
): InnerCompilationResult {
  let val: string = getVal(str, cursor);
  let pos: Position = { from: cursor.from, to: cursor.to };
  if (cursor.name === "IdentifierWithParam") {
    cursor.firstChild();
    val = getVal(str, cursor);
    cursor.nextSibling();
    cursor.nextSibling();
    let param: string = getVal(str, cursor);
    if (callIdentifiers.has(val) || conditionIdentifiers.has(val)) {
      cursor.parent();
      return { kind: "success", result: `yield karol.${val}("${param}");` };
    } else {
      cursor.parent();
      return {
        kind: "error",
        msg: "subroutine/condition calls must not contain parameters",
        pos: pos,
      };
    }
  } else {
    if (callIdentifiers.has(val) || conditionIdentifiers.has(val)) {
      return { kind: "success", result: `yield karol.${val}();` };
    }
    if (val === "wahr" || val === "falsch") {
      return { kind: "success", result: `yield ${val === "wahr"};` };
    }
    return {
      kind: "success",
      result: `for(let n of ${val}()) {\n\tyield n;\n};`,
    };
  }
}

function compileConditionIdentifier(
  str: string,
  cursor: TreeCursor
): InnerCompilationResult {
  let val: string = getVal(str, cursor);
  let pos: Position = { from: cursor.from, to: cursor.to };
  if (cursor.name === "IdentifierWithParam") {
    cursor.firstChild();
    val = getVal(str, cursor);
    cursor.nextSibling();
    cursor.nextSibling();
    let param: string = getVal(str, cursor);
    if (callIdentifiers.has(val) || conditionIdentifiers.has(val)) {
      cursor.parent();
      return {
        kind: "success",
        result: `(function*(){yield karol.${val}("${param}")})()`,
      };
    } else {
      cursor.parent();
      return {
        kind: "error",
        msg: "subroutine/condition calls must not contain parameters",
        pos: pos,
      };
    }
  } else {
    if (callIdentifiers.has(val) || conditionIdentifiers.has(val)) {
      return {
        kind: "success",
        result: `(function*(){yield karol.${val}()})()`,
      };
    }
    return { kind: "success", result: `${val}()` };
  }
}

function compileWhile(str: string, cursor: TreeCursor): InnerCompilationResult {
  let pos: Position = { from: cursor.from, to: cursor.to };
  cursor.firstChild(); // "wiederhole"
  cursor.nextSibling();

  let condType: string = getVal(str, cursor);
  let inv: boolean = false;
  let times: number = 0;
  let cond: InnerCompilationResult = { kind: "success", result: "" };
  if (condType === "solange") {
    cursor.nextSibling();
    if (getVal(str, cursor) === "nicht") {
      cursor.nextSibling();
      inv = true;
    }
    cond = compileConditionIdentifier(str, cursor);
    if (cond.kind === "error") return cond;
  } else if (cursor.name === "Number") {
    times = Number(condType);
    cursor.nextSibling(); // mal
  }

  let body = [];
  while (cursor.nextSibling()) {
    let val = getVal(str, cursor);
    if (val === "endewiederhole" || val === "*wiederhole") break;

    let res = compileInner(str, cursor);
    if (res.kind === "error") return res;
    body.push(res.result);
  }

  cursor.parent();

  if (condType === "immer") {
    return {
      kind: "success",
      result: `while(true) {\n\t${body.join("\n")}\n};`,
    };
  } else if (condType === "solange") {
    return {
      kind: "success",
      result: `while(true) {\n\tlet n;\n\tfor(n of ${
        cond.result
      }) {\n\t\tyield n;\n\t}\n\tif(${
        inv ? "" : "!"
      }n) {\n\t\tbreak;\n\t}\n\t${body.join("\n")}\n};`,
    };
  } else {
    // n mal
    return {
      kind: "success",
      result: `for(let i = 0; i < ${times}; i++) {\n\t${body.join("\n")}\n};`,
    };
  }
}

function compileWhileEnd(
  str: string,
  cursor: TreeCursor
): InnerCompilationResult {
  let pos: Position = { from: cursor.from, to: cursor.to };
  cursor.firstChild(); // "wiederhole"
  cursor.nextSibling();

  let body = [];
  while (cursor.nextSibling()) {
    let val = getVal(str, cursor);
    if (val === "endewiederhole" || val === "*wiederhole") break;

    let res = compileInner(str, cursor);
    if (res.kind === "error") return res;
    body.push(res.result);
  }

  cursor.nextSibling(); // "solange" | "bis"

  let condType: string = getVal(str, cursor);
  let inv: boolean = false;
  let bis: boolean = false;
  let cond: InnerCompilationResult;

  if (condType === "bis") {
    bis = true;
  }
  cursor.nextSibling();
  if (getVal(str, cursor) === "nicht") {
    cursor.nextSibling();
    inv = true;
  }
  cond = compileConditionIdentifier(str, cursor);
  if (cond.kind === "error") return cond;

  cursor.parent();
  return {
    kind: "success",
    result: `do {\n\t${body.join("\n")}\n\tlet n;\n\tfor(n of ${
      cond.result
    }) {\n\t\tyield n;\n\t}\n\tif(${
      inv !== bis ? "" : "!"
    }n) {\n\t\tbreak;\n\t}\n} while(true);`,
  };
}

function compileIf(str: string, cursor: TreeCursor): InnerCompilationResult {
  let pos: Position = { from: cursor.from, to: cursor.to };
  cursor.firstChild(); // "wenn"
  cursor.nextSibling();

  let val: string = getVal(str, cursor);
  let inv: boolean = false;
  if (val === "nicht") {
    cursor.nextSibling();
    inv = true;
  }

  let cond: InnerCompilationResult = compileConditionIdentifier(str, cursor);
  if (cond.kind === "error") return cond;

  cursor.nextSibling(); // "dann"

  let isElse: boolean = false;
  const body: String[] = [];
  const elseBody: String[] = [];

  while (cursor.nextSibling()) {
    val = getVal(str, cursor);
    if (val === "endewenn" || val === "*wenn") break;
    if (val === "sonst") {
      isElse = true;
      cursor.nextSibling();
    }

    if (isElse) {
      let res = compileInner(str, cursor);
      if (res.kind === "error") return res;
      elseBody.push(res.result);
    } else {
      let res = compileInner(str, cursor);
      if (res.kind === "error") return res;
      body.push(res.result);
    }
  }

  cursor.parent();
  if (isElse)
    return {
      kind: "success",
      result: `{\tlet n;\n\tfor(n of ${
        cond.result
      }) {\n\t\tyield n;\n\t}\n\tif(${inv ? "!" : ""}n) {\n\t\t${body.join(
        "\n"
      )}\n\t} else {\n\t\t${elseBody.join("\n")}\n\t}\n};`,
    };

  return {
    kind: "success",
    result: `{\tlet n;\n\tfor(n of ${cond.result}) {\n\t\tyield n;\n\t}\n\tif(${
      inv ? "!" : ""
    }n) {\n\t\t${body.join("\n")}\n\t}\n};`,
  };
}

function compileSubroutine(
  str: string,
  cursor: TreeCursor
): DefinitionCompilationResult {
  let pos: Position = { from: cursor.from, to: cursor.to };
  cursor.firstChild(); // "Anweisung"
  cursor.nextSibling();
  let subName: string = getVal(str, cursor);
  if (callIdentifiers.has(subName) || conditionIdentifiers.has(subName))
    return {
      kind: "error",
      msg: "redefinition of predefined subroutine",
      pos: pos,
    };

  let val;
  const body: String[] = [];
  while (cursor.nextSibling()) {
    val = getVal(str, cursor);
    if (val === "endeAnweisung" || val === "*Anweisung") break;

    let res = compileInner(str, cursor);
    if (res.kind === "error") return res;
    body.push(res.result);
  }
  cursor.parent();

  return {
    kind: "success",
    result: `function* ${subName}() {\n${body.join("\n")}\n}`,
    identifier: subName,
  };
}

function compileCondition(
  str: string,
  cursor: TreeCursor
): DefinitionCompilationResult {
  let pos: Position = { from: cursor.from, to: cursor.to };
  cursor.firstChild(); // "Bedingung"
  cursor.nextSibling();
  let subName: string = getVal(str, cursor);
  if (callIdentifiers.has(subName) || conditionIdentifiers.has(subName))
    return {
      kind: "error",
      msg: "redefinition of predefined condition",
      pos: pos,
    };

  let val;
  const body: String[] = [];
  while (cursor.nextSibling()) {
    val = getVal(str, cursor);
    if (val === "endeBedingung" || val === "*Bedingung") break;

    let res = compileInner(str, cursor);
    if (res.kind === "error") return res;
    body.push(res.result);
  }
  cursor.parent();

  return {
    kind: "success",
    result: `function* ${subName}() {\n${body.join("\n")}\n}`,
    identifier: subName,
  };
}

function compileInner(str: string, cursor: TreeCursor): InnerCompilationResult {
  let val: string = getVal(str, cursor);
  let pos: Position = { from: cursor.from, to: cursor.to };
  switch (cursor.name) {
    case "Identifier":
      return compileIdentifier(str, cursor);
    case "IdentifierWithParam":
      return compileIdentifier(str, cursor);
    case "If":
      return compileIf(str, cursor);
    case "While":
      return compileWhile(str, cursor);
    case "WhileEnd":
      return compileWhileEnd(str, cursor);
    case "Subroutine":
      return {
        kind: "error",
        msg: "subroutine must not be declared inside another subroutine/condition declaration",
        pos: pos,
      };
    case "Condition":
      return {
        kind: "error",
        msg: "condition must not be declared inside another subroutine/condition declaration",
        pos: pos,
      };
    default:
      // faulty node detected -> parser error
      return { kind: "error", msg: "parse error", pos: pos };
  }
}

export function compile(str: string): CompilationResult {
  let cursor: TreeCursor = parse(str).cursor();
  const program: string[] = [];
  const conditions: Set<string> = new Set();
  const subroutines: Set<string> = new Set();

  cursor.firstChild();
  do {
    let val: string = getVal(str, cursor);
    let pos: Position = { from: cursor.from, to: cursor.to };
    let res: InnerCompilationResult;
    let defRes: DefinitionCompilationResult;
    switch (cursor.name) {
      case "Subroutine":
        defRes = compileSubroutine(str, cursor);
        if (defRes.kind === "error") return defRes;
        if (
          !subroutines.has(defRes.identifier) &&
          !conditions.has(defRes.identifier)
        )
          subroutines.add(defRes.identifier);
        else
          return {
            kind: "error",
            msg: "illegal subroutine redefintion",
            pos: pos,
          };
        program.push(defRes.result);
        break;
      case "Condition":
        defRes = compileCondition(str, cursor);
        if (defRes.kind === "error") return defRes;
        if (
          !subroutines.has(defRes.identifier) &&
          !conditions.has(defRes.identifier)
        )
          conditions.add(defRes.identifier);
        else
          return {
            kind: "error",
            msg: "illegal subroutine redefintion",
            pos: pos,
          };
        program.push(defRes.result);
        break;
      default:
        res = compileInner(str, cursor);
        if (res.kind === "error") return res;
        program.push(res.result);
        break;
    }
  } while (cursor.nextSibling());

  cursor.parent();
  cursor.firstChild();

  // additional semantic checks
  do {
    let val: string = getVal(str, cursor);
    let pos: Position = { from: cursor.from, to: cursor.to };
    let lit = cursor.name;
    switch (lit) {
      case "Identifier":
        if (
          !conditions.has(val) &&
          !subroutines.has(val) &&
          !conditionIdentifiers.has(val) &&
          !callIdentifiers.has(val) &&
          val !== "wahr" &&
          val !== "falsch"
        ) {
          return {
            kind: "error",
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
        if (!conditions.has(val) && !conditionIdentifiers.has(val)) {
          return {
            kind: "error",
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
        if (!conditions.has(val) && !conditionIdentifiers.has(val)) {
          return {
            kind: "error",
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
        if (!conditions.has(val) && !conditionIdentifiers.has(val)) {
          return {
            kind: "error",
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
        console.log(cursor.name);
        return { kind: "error", msg: "parse error", pos: pos };
    }
  } while (cursor.next());

  let GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
  return {
    kind: "success",
    result: new GeneratorFunction("karol", `${program.join("\n")}`),
  };
}

export * from "./compiler_types";
