import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { fileTests } from "@lezer/generator/dist/test";
import { expect, it, describe } from "vitest";
import { compile, karolLanguage } from "../dist/index.mjs";

const caseDir = path.dirname(fileURLToPath(import.meta.url));

for (const file of fs.readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) {
    continue;
  }

  const name = /^[^.]*/.exec(file)[0];
  describe(name, () => {
    for (const { name, run } of fileTests(
      fs.readFileSync(path.join(caseDir, file), "utf8"),
      file,
    )) {
      it(name, () => run(karolLanguage.parser));
    }
  });
}

describe("TestProgram", () => {
  let res;

  it("executes successfully", () => {
    res = compile(`
        Anweisung test
          Schritt
          test3
        endeAnweisung
        Schritt
        wiederhole 10 mal
          test
        endewiederhole
        wiederhole solange test2
          test
        endewiederhole
        Bedingung test2
          wenn IstZiegel(3) dann
            wahr
          sonst
            falsch
          endewenn
        endeBedingung
        wiederhole
          test
        *wiederhole solange IstZiegel(5)
        Anweisung test3
          Schritt
        *Anweisung
      `);
    let i = 0;
    let j = 0;
    const karolMethods = {
      schritt: function () {
        return ++j;
      },
      istziegel: function (val) {
        if (i < Number(val)) {
          i++;
          return true;
        } else {
          i = 0;
          return false;
        }
      },
    };
    for (const stmt of res(karolMethods)) {
    }
    expect(39).toEqual(j);
  });
});
