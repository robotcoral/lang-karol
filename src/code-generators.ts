import { DefinitionCompilationResult } from "./compiler-types";

export function generateCall(val: string): string {
  return `yield karol.${val}();`;
}

export function generateCallWithParam(val: string, param: string): string {
  return `yield karol.${val}("${param}");`;
}

export function generateBoolean(val: string): string {
  return `yield ${val === "wahr"};`;
}

export function generateCustomCall(val: string): string {
  return `for(let n of ${val}()){yield n;};`;
}

export function generateCallInConditionWithParam(
  val: string,
  param: string,
): string {
  return `(function*(){yield karol.${val}("${param}")})()`;
}

export function generateCallInCondition(val: string): string {
  return `(function*(){yield karol.${val}()})()`;
}

export function generateCustomCallInCondition(val: string): string {
  return `${val}()`;
}

export function generateInfiniteLoop(body: string[]): string {
  return `while(true){${body.join("")}};`;
}

export function generateWhileLoop(
  body: string[],
  cond: string,
  inv: boolean,
): string {
  return `while(true){let n;for(n of ${cond}){yield n;}if(${
    inv ? "" : "!"
  }n){break;}${body.join("")}};`;
}

export function generateTimesLoop(body: string[], times: number): string {
  return `for(let i=0;i<${times};i++){${body.join("")}};`;
}

export function generateWhileEndLoop(
  body: string[],
  cond: string,
  inv: boolean,
  bis: boolean,
): string {
  return `do{${body.join("")}let n;for(n of ${cond}){yield n;}if(${
    inv === bis ? "!" : ""
  }n){break;}}while(true);`;
}

export function generateIfElse(
  body: string[],
  elseBody: string[],
  cond: string,
  inv: boolean,
) {
  return `{let n;for(n of ${cond}){yield n;};if(${inv ? "!" : ""}n){${body.join(
    "",
  )}}else{${elseBody.join("")}}};`;
}

export function generateIf(body: string[], cond: string, inv: boolean) {
  return `{let n;for(n of ${cond}){yield n;};if(${inv ? "!" : ""}n){${body.join(
    "",
  )}}};`;
}

export function generateSub(
  body: string[],
  subName: string,
): DefinitionCompilationResult {
  return {
    result: `function* ${subName}(){${body.join("")}};`,
    identifier: subName,
  };
}
