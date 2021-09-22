import { ExternalTokenizer, InputStream, Stack } from "@lezer/lr";
import { 
    beginSubroutine, 
    endSubroutine,
    beginCondition,
    endCondition,
    beginIf,
    then,
    beginElse,
    endIf,
    beginWhile,
    endWhile,
    forever,
    times,
    doWhile,
    until,
    not 
} from "./karol.terms";

function generateKeywordToken(keyword: number, literals: string[]) {
    return new ExternalTokenizer((input: InputStream, stack: Stack) => {
        let remainingLiterals = literals;
        let next = input.next;
        while(remainingLiterals.length > 0 && next != -1) {
            remainingLiterals = remainingLiterals
                .filter(lit =>
                    lit.toUpperCase().charCodeAt(0) == next ||
                    lit.toLowerCase().charCodeAt(0) == next
                )
                .map((lit) => lit.slice(1));
            
            if(remainingLiterals.includes("")) {
                input.advance();
                input.acceptToken(keyword);
            }
            next = input.advance();
        }
    });
}

export const beginSubroutineKW = generateKeywordToken(beginSubroutine, ["anweisung"]);
export const endSubroutineKW = generateKeywordToken(endSubroutine, ["endeanweisung", "*anweisung"]);
export const beginConditionKW = generateKeywordToken(beginCondition, ["bedingung"]);
export const endConditionKW = generateKeywordToken(endCondition, ["endebedingung", "*bedingung"]);
export const beginIfKW = generateKeywordToken(beginIf, ["wenn"]);
export const thenKW = generateKeywordToken(then, ["dann"]);
export const beginElseKW = generateKeywordToken(beginElse, ["sonst"]);
export const endIfKW = generateKeywordToken(endIf, ["endewenn", "*wenn"]);
export const beginWhileKW = generateKeywordToken(beginWhile, ["wiederhole"]);
export const endWhileKW = generateKeywordToken(endWhile, ["endewiederhole", "*wiederhole"]);
export const foreverKW = generateKeywordToken(forever, ["immer"]);
export const timesKW = generateKeywordToken(times, ["mal"]);
export const doWhileKW = generateKeywordToken(doWhile, ["solange"]);
export const untilKW = generateKeywordToken(until, ["bis"]);
export const notKW = generateKeywordToken(not, ["nicht"]);