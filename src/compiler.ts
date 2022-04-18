import { parse } from "./parser";
import {
    callIdentifiers,
    conditionIdentifiers,
    DefinitionCompilationResult,
    CondCompilationResult, 
    TreeData,
    Position,
} from "./compiler_types";
import * as gen from "./code_generators";
import * as karolErrors from "./compiler_errors";
import { semanticAnalysis } from "./semantics";
import { getVal, getPos, isPredefinedIdentifier, isBool, isNotRedefined, isSub } from "./compiler_helpers";

export const callIdentifiersSet = new Set(callIdentifiers);
export const conditionIdentifiersSet = new Set(conditionIdentifiers);

// TODO: split compileConditionIdentifier with and without param
// TODO: compileParam as a seperate function
// TODO: boolean as condition not allowed

function compileConditionIdentifier(data: TreeData): string {
  let val: string = getVal(data);
  let pos: Position = getPos(data);
  if (data.cursor.name === "IdentifierWithParam") {
    data.cursor.firstChild(); // Identifier
    val = getVal(data);
    data.cursor.nextSibling(); // "("
    data.cursor.nextSibling(); // (Colour | Number)
    let param: string = getVal(data);
    if (isPredefinedIdentifier(val)) {
      data.cursor.parent(); // IdentifierWithParam
      return gen.generateCallInConditionWithParam(val, param);
    } else {
      data.cursor.parent(); // IdentifierWithParam
      throw new karolErrors.NoParamAllowedError(pos, val);
    }
  } else {
    if (isPredefinedIdentifier(val)) {
      return gen.generateCallInCondition(val);
    }
    return gen.generateCustomCallInCondition(val);
  }
}

function compileBody(data: TreeData): string[] {
  let body:string[] = [];
  if(data.cursor.firstChild()) {
    do 
      body.push(compileStatement(data)); 
    while(data.cursor.nextSibling());
    data.cursor.parent(); // Body
  }
  return body;
}

function compileCond(data: TreeData): CondCompilationResult {
  let inv: boolean = false;
  let cond: string;
  data.cursor.firstChild();
  if (getVal(data) === "nicht") {
    data.cursor.nextSibling();
    inv = true;
  }
  cond = compileConditionIdentifier(data);
  data.cursor.parent(); // Cond
  return { result: cond, inv: inv};
}

const statementCompilers: Record<string, (data: TreeData) => string> = {};

statementCompilers.Identifier = function(data: TreeData): string {
  let val: string = getVal(data);
  if(isPredefinedIdentifier(val)) {
    return gen.generateCall(val);
  } else if(isBool(val)) {
    return gen.generateBoolean(val);
  } else {
    return gen.generateCustomCall(val);
  }
}

statementCompilers.IdentifierWithParam = function(data: TreeData): string {
  let val: string = getVal(data);
  let pos: Position = getPos(data);
  data.cursor.firstChild(); // Identifier
  val = getVal(data);
  data.cursor.nextSibling(); // "("
  data.cursor.nextSibling(); // (Colour | Number)
  let param: string = getVal(data);
  data.cursor.parent(); // IdentifierWithParam
  if (isPredefinedIdentifier(val)) {
    return gen.generateCallWithParam(val, param);
  } else {
    throw new karolErrors.NoParamAllowedError(pos, val);
  }
}

statementCompilers.InfLoop = function(data: TreeData): string {
  let body;
  data.cursor.firstChild(); // beginWhile
  data.cursor.nextSibling(); // forever
  data.cursor.nextSibling(); // Body
  body = compileBody(data);
  data.cursor.parent(); // InfLoop
  return gen.generateInfiniteLoop(body);
}

statementCompilers.TimesLoop = function(data: TreeData): string {
  let body, times;
  data.cursor.firstChild(); // beginWhile
  data.cursor.nextSibling(); // Number
  times = Number(getVal(data));
  data.cursor.nextSibling(); // times
  data.cursor.nextSibling(); // Body
  body = compileBody(data);
  data.cursor.parent(); // TimesLoop
  return gen.generateTimesLoop(body, times);
}

statementCompilers.While = function(data: TreeData): string {
  let cond: CondCompilationResult;
  let body: string[];
  data.cursor.firstChild(); // beginWhile
  data.cursor.nextSibling(); // doWhile
  data.cursor.nextSibling(); // Cond
  cond = compileCond(data);
  data.cursor.nextSibling(); // Body
  body = compileBody(data);
  data.cursor.parent(); // While
  return gen.generateWhileLoop(body, cond.result, cond.inv);
}
  
statementCompilers.DoWhile = function(data: TreeData): string {
  let bis: boolean = false;
  let cond: CondCompilationResult;
  let body: string[];
  data.cursor.firstChild(); // beginWhile
  body = compileBody(data);
  data.cursor.nextSibling(); // doWhile | until
  bis = getVal(data) === "bis";
  data.cursor.nextSibling(); // Cond
  cond = compileCond(data);
  data.cursor.parent(); // WhileEnd
  return gen.generateWhileEndLoop(body, cond.result, cond.inv, bis);
}
  
statementCompilers.If = function(data: TreeData): string {
  let body: string[];
  let cond: CondCompilationResult;
  data.cursor.firstChild(); // beginIf
  data.cursor.nextSibling(); // Cond
  cond = compileCond(data);
  data.cursor.nextSibling(); // then
  data.cursor.nextSibling(); // Body
  body = compileBody(data);
  data.cursor.parent(); // If
  return gen.generateIf(body, cond.result, cond.inv);
}

statementCompilers.IfElse = function(data: TreeData): string {
  let body: string[];
  let elseBody: string[];
  let cond: CondCompilationResult;
  data.cursor.firstChild(); // beginIf
  data.cursor.nextSibling(); // Cond
  cond = compileCond(data);
  data.cursor.nextSibling(); // then
  data.cursor.nextSibling(); // Body
  body = compileBody(data);
  data.cursor.nextSibling(); // else
  data.cursor.nextSibling(); // Body
  elseBody = compileBody(data);
  data.cursor.parent(); // IfElse
  return gen.generateIfElse(body, elseBody, cond.result, cond.inv);
}

function compileDefinition(data: TreeData): DefinitionCompilationResult {
  let pos: Position = getPos(data);
  let body: string[];
  let subName: string;
  data.cursor.firstChild(); // beginSubroutine/beginCondition
  data.cursor.nextSibling(); // Identifier
  subName = getVal(data);
  if (isPredefinedIdentifier(subName))
    throw new karolErrors.PredefinedSubRedefinitionError(pos, subName);
  data.cursor.nextSibling(); // Body
  body = compileBody(data);
  data.cursor.parent(); // Subroutine/Condition

  return gen.generateSub(body, subName);
}
  
function compileStatement(data: TreeData): string {
  let val: string = getVal(data);
  let pos: Position = getPos(data);
  if(isSub(data))
    throw new karolErrors.NestedSubDefintionError(pos, val); // TODO: give actual subname
  else
    return statementCompilers[data.cursor.name](data);  
}
  
export function compile(str: string): GeneratorFunction {
    str = str.toLowerCase();
    let data: TreeData = {
      str: str,
      cursor: parse(str).cursor()
    }
    const program: string[] = [];
    const conditions: Set<string> = new Set();
    const subroutines: Set<string> = new Set();
  
    data.cursor.firstChild();
    do {
      let val: string = getVal(data);
      let pos: Position = getPos(data);
      let res: string;
      let defRes: DefinitionCompilationResult;
      if(isSub(data)) {
        defRes = compileDefinition(data);
        if (isNotRedefined(subroutines, conditions, defRes))
          if(data.cursor.name === "Subroutine")
            subroutines.add(defRes.identifier);
          else
            conditions.add(defRes.identifier);
        else
          throw new karolErrors.IllegalRedefinitionError(pos, defRes.identifier);
        program.push(defRes.result);
      } else {
        res = compileStatement(data);
        program.push(res);
      }
    } while (data.cursor.nextSibling());
  
    data.cursor.parent();
    data.cursor.firstChild();
  
    semanticAnalysis(str, data.cursor, conditions, subroutines);
  
    let GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
    return new GeneratorFunction("karol", `${program.join("")}`);
}