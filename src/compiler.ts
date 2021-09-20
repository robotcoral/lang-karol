import { parse } from "./parser";
import { TreeCursor } from "@lezer/common";
import {
    callIdentifiers,
    conditionIdentifiers,
    DefinitionCompilationResult,
    Position,
} from "./compiler_types";

const callIdentifiersSet = new Set(callIdentifiers);
const conditionIdentifiersSet = new Set(conditionIdentifiers);
  
function getVal(str: string, cursor: TreeCursor): string {
    return str.substring(cursor.from, cursor.to);
}

function compileIdentifier(
    str: string,
    cursor: TreeCursor
  ): string {
    let val: string = getVal(str, cursor);
    let pos: Position = { from: cursor.from, to: cursor.to };
    if (cursor.name === "IdentifierWithParam") {
      cursor.firstChild();
      val = getVal(str, cursor);
      cursor.nextSibling();
      cursor.nextSibling();
      let param: string = getVal(str, cursor);
      if (callIdentifiersSet.has(val) || conditionIdentifiersSet.has(val)) {
        cursor.parent();
        return `yield karol.${val}("${param}");`;
      } else {
        cursor.parent();
        throw({
          msg: "subroutine/condition calls must not contain parameters",
          pos: pos,
        });
      }
    } else {
      if (callIdentifiersSet.has(val) || conditionIdentifiersSet.has(val)) {
        return `yield karol.${val}();`;
      }
      if (val === "wahr" || val === "falsch") {
        return `yield ${val === "wahr"};`;
      }
      return `for(let n of ${val}()){yield n;};`;
    }
}
  
function compileConditionIdentifier(
    str: string,
    cursor: TreeCursor
  ): string {
    let val: string = getVal(str, cursor);
    let pos: Position = { from: cursor.from, to: cursor.to };
    if (cursor.name === "IdentifierWithParam") {
      cursor.firstChild();
      val = getVal(str, cursor);
      cursor.nextSibling();
      cursor.nextSibling();
      let param: string = getVal(str, cursor);
      if (callIdentifiersSet.has(val) || conditionIdentifiersSet.has(val)) {
        cursor.parent();
        return `(function*(){yield karol.${val}("${param}")})()`;
      } else {
        cursor.parent();
        throw({
          msg: "subroutine/condition calls must not contain parameters",
          pos: pos,
        });
      }
    } else {
      if (callIdentifiersSet.has(val) || conditionIdentifiersSet.has(val)) {
        return `(function*(){yield karol.${val}()})()`;
      }
      return `${val}()`;
    }
}
  
function compileWhile(str: string, cursor: TreeCursor): string {
    cursor.firstChild(); // "wiederhole"
    cursor.nextSibling();
  
    let condType: string = getVal(str, cursor);
    let inv: boolean = false;
    let times: number = 0;
    let cond: string = "";
    if (condType === "solange") {
      cursor.nextSibling();
      if (getVal(str, cursor) === "nicht") {
        cursor.nextSibling();
        inv = true;
      }
      cond = compileConditionIdentifier(str, cursor);
      
    } else if (cursor.name === "Number") {
      times = Number(condType);
      cursor.nextSibling(); // mal
    }
  
    let body = [];
    while (cursor.nextSibling()) {
      let val = getVal(str, cursor);
      if (val === "endewiederhole" || val === "*wiederhole") break;
  
      let res = compileInner(str, cursor);
      body.push(res);
    }
  
    cursor.parent();
  
    if (condType === "immer") {
      return `while(true){${body.join("")}};`;
    } else if (condType === "solange") {
      return `while(true){let n;for(n of ${cond}){yield n;}if(${inv ? "" : "!"}n){break;}${body.join("")}};`;
    } else {
      return `for(let i=0;i<${times};i++){${body.join("")}};`;
    }
}
  
function compileWhileEnd(
    str: string,
    cursor: TreeCursor
  ): string {
    cursor.firstChild(); // "wiederhole"
  
    let body = [];
    while (cursor.nextSibling()) {
      let val = getVal(str, cursor);
      if (val === "endewiederhole" || val === "*wiederhole") break;
  
      let res = compileInner(str, cursor);
      body.push(res);
    }
  
    cursor.nextSibling(); // "solange" | "bis"
  
    let condType: string = getVal(str, cursor);
    let inv: boolean = false;
    let bis: boolean = false;
    let cond: string;
  
    if (condType === "bis") {
      bis = true;
    }
    cursor.nextSibling();
    if (getVal(str, cursor) === "nicht") {
      cursor.nextSibling();
      inv = true;
    }
    cond = compileConditionIdentifier(str, cursor);
  
    cursor.parent();
    return `do{${body.join("")}let n;for(n of ${cond}){yield n;}if(${inv !== bis ? "" : "!"}n){break;}}while(true);`;
}
  
function compileIf(str: string, cursor: TreeCursor): string {
    cursor.firstChild(); // "wenn"
    cursor.nextSibling();
  
    let val: string = getVal(str, cursor);
    let inv: boolean = false;
    if (val === "nicht") {
      cursor.nextSibling();
      inv = true;
    }
  
    let cond: string = compileConditionIdentifier(str, cursor);
  
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
        elseBody.push(res);
      } else {
        let res = compileInner(str, cursor);
        body.push(res);
      }
    }
  
    cursor.parent();
    if (isElse)
      return `{let n;for(n of ${cond}){yield n;};if(${inv ? "!" : ""}n){${body.join("")}}else{${elseBody.join("")}}};`;
  
    return `{let n;for(n of ${cond}){yield n;};if(${inv ? "!" : ""}n){${body.join("")}}};`;
}
  
function compileSubroutine(
    str: string,
    cursor: TreeCursor
  ): DefinitionCompilationResult {
    let pos: Position = { from: cursor.from, to: cursor.to };
    cursor.firstChild(); // "Anweisung"
    cursor.nextSibling();
    let subName: string = getVal(str, cursor);
    if (callIdentifiersSet.has(subName) || conditionIdentifiersSet.has(subName))
      throw ({
        msg: "redefinition of predefined subroutine",
        pos: pos,
      });
  
    let val;
    const body: String[] = [];
    while (cursor.nextSibling()) {
      val = getVal(str, cursor);
      if (val === "endeAnweisung" || val === "*Anweisung") break;
  
      let res = compileInner(str, cursor);
      body.push(res);
    }
    cursor.parent();
  
    return {
      result: `function* ${subName}(){${body.join("")}};`,
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
    if (callIdentifiersSet.has(subName) || conditionIdentifiersSet.has(subName))
      throw ({
        msg: "redefinition of predefined condition",
        pos: pos,
      });
  
    let val;
    const body: String[] = [];
    while (cursor.nextSibling()) {
      val = getVal(str, cursor);
      if (val === "endeBedingung" || val === "*Bedingung") break;
  
      let res = compileInner(str, cursor);
      body.push(res);
    }
    cursor.parent();
  
    return {
      result: `function* ${subName}(){${body.join("")}};`,
      identifier: subName,
    };
}
  
function compileInner(str: string, cursor: TreeCursor): string {
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
        throw ({
          msg: "subroutine must not be declared inside another subroutine/condition declaration",
          pos: pos,
        });
      case "Condition":
        throw ({
          msg: "condition must not be declared inside another subroutine/condition declaration",
          pos: pos,
        });
      default:
        // faulty node detected -> parser error
        throw { msg: "parse error", pos: pos };
    }
}
  
export function compile(str: string): GeneratorFunction {
    let cursor: TreeCursor = parse(str).cursor();
    const program: string[] = [];
    const conditions: Set<string> = new Set();
    const subroutines: Set<string> = new Set();
  
    cursor.firstChild();
    do {
      let val: string = getVal(str, cursor);
      let pos: Position = { from: cursor.from, to: cursor.to };
      let res: string;
      let defRes: DefinitionCompilationResult;
      switch (cursor.name) {
        case "Subroutine":
          defRes = compileSubroutine(str, cursor);
          if (
            !subroutines.has(defRes.identifier) &&
            !conditions.has(defRes.identifier)
          )
            subroutines.add(defRes.identifier);
          else
            throw({
              msg: "illegal subroutine redefintion",
              pos: pos,
            });
          program.push(defRes.result);
          break;
        case "Condition":
          defRes = compileCondition(str, cursor);
          if (
            !subroutines.has(defRes.identifier) &&
            !conditions.has(defRes.identifier)
          )
            conditions.add(defRes.identifier);
          else
            throw({
              msg: "illegal subroutine redefintion",
              pos: pos,
            });
          program.push(defRes.result);
          break;
        default:
          res = compileInner(str, cursor);
          program.push(res);
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
            !conditionIdentifiersSet.has(val) &&
            !callIdentifiersSet.has(val) &&
            val !== "wahr" &&
            val !== "falsch"
          ) {
            throw({
              msg: "unknown subroutine/condition",
              pos: { from: cursor.from, to: cursor.to },
            });
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
            throw({
              msg: "identifier must be a condition",
              pos: { from: cursor.from, to: cursor.to },
            });
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
            throw({
              msg: "identifier must be a condition",
              pos: { from: cursor.from, to: cursor.to },
            });
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
            throw({
              msg: "identifier must be a condition",
              pos: { from: cursor.from, to: cursor.to },
            });
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
  
    let GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
    return new GeneratorFunction("karol", `${program.join("")}`);
}