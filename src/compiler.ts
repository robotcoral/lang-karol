import { parse } from "./parser";
import { TreeCursor } from "@lezer/common";
import {
    callIdentifiers,
    conditionIdentifiers,
    DefinitionCompilationResult,
    Position,
} from "./compiler_types";
import * as gen from "./code_generators";
import * as karolErrors from "./compiler_errors";
import { semanticAnalysis } from "./semantics";

export const callIdentifiersSet = new Set(callIdentifiers);
export const conditionIdentifiersSet = new Set(conditionIdentifiers);
  
export function getVal(str: string, cursor: TreeCursor): string {
    return str.substring(cursor.from, cursor.to);
}

function isPredefinedIdentifier(val: string) {
  return callIdentifiersSet.has(val) || conditionIdentifiersSet.has(val);
}

function isBool(val: string) {
  return val === "wahr" || val === "falsch";
}

function isEnde(token: string, val: string) {
  return val === `ende${token}` || val === `*${token}`;
}

function isNotRedefined(subroutines: Set<string>, conditions: Set<string>, defRes: DefinitionCompilationResult) {
  return !subroutines.has(defRes.identifier) && !conditions.has(defRes.identifier)
}

function compileIdentifier(
    str: string,
    cursor: TreeCursor
  ): string {
    let val: string = getVal(str, cursor);
    let pos: Position = { from: cursor.from, to: cursor.to };
    if (cursor.name === "IdentifierWithParam") {
      cursor.firstChild(); // Identifier
      val = getVal(str, cursor);
      cursor.nextSibling(); // "("
      cursor.nextSibling(); // (Colour | Number)
      let param: string = getVal(str, cursor);
      if (isPredefinedIdentifier(val)) {
        cursor.parent(); // IdentifierWithParam
        return gen.generateCallWithParam(val, param);
      } else {
        cursor.parent(); // IdentifierWithParam
        throw karolErrors.noParamAllowed(pos);
      }
    } else {
      if (isPredefinedIdentifier(val)) {
        return gen.generateCall(val);
      }
      if (isBool(val)) {
        return gen.generateBoolean(val);
      }
      return gen.generateCustomCall(val);
    }
}
  
function compileConditionIdentifier(
    str: string,
    cursor: TreeCursor
  ): string {
    let val: string = getVal(str, cursor);
    let pos: Position = { from: cursor.from, to: cursor.to };
    if (cursor.name === "IdentifierWithParam") {
      cursor.firstChild(); // Identifier
      val = getVal(str, cursor);
      cursor.nextSibling(); // "("
      cursor.nextSibling(); // (Colour | Number)
      let param: string = getVal(str, cursor);
      if (isPredefinedIdentifier(val)) {
        cursor.parent(); // IdentifierWithParam
        return gen.generateCallInConditionWithParam(val, param);
      } else {
        cursor.parent(); // IdentifierWithParam
        throw karolErrors.noParamAllowed(pos);
      }
    } else {
      if (isPredefinedIdentifier(val)) {
        return gen.generateCallInCondition(val);
      }
      return gen.generateCustomCallInCondition(val);
    }
}
  
function compileWhile(str: string, cursor: TreeCursor): string {
    cursor.firstChild(); // beginWhile
    cursor.nextSibling(); // (forever | Number times | doWhile not? (Identifier | IdentifierWithParam))
  
    let condType: string = getVal(str, cursor);
    let inv: boolean = false;
    let times: number = 0;
    let cond: string = "";
    if (condType === "solange") {
      cursor.nextSibling(); // not?
      if (getVal(str, cursor) === "nicht") {
        cursor.nextSibling();
        inv = true;
      }
      cond = compileConditionIdentifier(str, cursor);
      
    } else if (cursor.name === "Number") {
      times = Number(condType);
      cursor.nextSibling(); // times
    }
  
    let body:string[] = [];
    while (cursor.nextSibling()) {
      let val = getVal(str, cursor);
      if (isEnde("wiederhole", val)) break;
  
      let res = compileInner(str, cursor);
      body.push(res);
    }
  
    cursor.parent(); // While
  
    if (condType === "immer") {
      return gen.generateInfiniteLoop(body);
    } else if (condType === "solange") {
      return gen.generateWhileLoop(body, cond, inv);
    } else {
      return gen.generateTimesLoop(body, times);
    }
}
  
function compileWhileEnd(
    str: string,
    cursor: TreeCursor
  ): string {
    cursor.firstChild(); // beginWhile
  
    let body = [];
    while (cursor.nextSibling()) {
      let val = getVal(str, cursor);
      if (isEnde("wiederhole", val)) break;
  
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
    cursor.nextSibling(); // not?
    if (getVal(str, cursor) === "nicht") {
      cursor.nextSibling();
      inv = true;
    }
    cond = compileConditionIdentifier(str, cursor);
  
    cursor.parent(); // WhileEnd
    return gen.generateWhileEndLoop(body, cond, inv, bis);
}
  
function compileIf(str: string, cursor: TreeCursor): string {
    cursor.firstChild(); // "beginIf"
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
    const body: string[] = [];
    const elseBody: string[] = [];
  
    while (cursor.nextSibling()) {
      val = getVal(str, cursor);
      if (isEnde("wenn", val)) break;
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
      return gen.generateIfElse(body, elseBody, cond, inv);
  
    return gen.generateIf(body, cond, inv);
}

function compileDefinition(
  str: string,
  cursor: TreeCursor
): DefinitionCompilationResult {
  let pos: Position = { from: cursor.from, to: cursor.to };
  let isSub = cursor.name === "Subroutine";
  cursor.firstChild();
  cursor.nextSibling();
  let subName: string = getVal(str, cursor);
  if (isPredefinedIdentifier(subName))
    if(isSub)
      throw karolErrors.predefinedSubRedefinition(pos);
    else
      throw karolErrors.predefinedCondRedefinition(pos);

  let val;
  const body: string[] = [];
  while (cursor.nextSibling()) {
    val = getVal(str, cursor);
    if (isEnde(isSub ? "anweisung" : "bedingung", val)) break;

    let res = compileInner(str, cursor);
    body.push(res);
  }
  cursor.parent();

  return gen.generateSub(body, subName);
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
        throw karolErrors.nestedSubDefintion(pos);
      case "Condition":
        throw karolErrors.nestedCondDefintion(pos);
      default:
        // faulty node detected -> parser error
        throw { msg: "parse error", pos: pos };
    }
}
  
export function compile(str: string): GeneratorFunction {
    str = str.toLowerCase();
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
      if(cursor.name === "Subroutine" || cursor.name === "Condition") {
        defRes = compileDefinition(str, cursor);
        if (isNotRedefined(subroutines, conditions, defRes))
          if(cursor.name === "Subroutine")
            subroutines.add(defRes.identifier);
          else
            conditions.add(defRes.identifier);
        else
          throw karolErrors.illegalRedefinition(pos);
        program.push(defRes.result);
      } else {
        res = compileInner(str, cursor);
        program.push(res);
      }
    } while (cursor.nextSibling());
  
    cursor.parent();
    cursor.firstChild();
  
    semanticAnalysis(str, cursor, conditions, subroutines);
  
    let GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
    return new GeneratorFunction("karol", `${program.join("")}`);
}