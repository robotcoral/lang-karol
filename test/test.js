import { fileTests } from "@lezer/generator/dist/test";
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compile, karolLanguage } from "../dist/index.js";

let caseDir = path.dirname(fileURLToPath(import.meta.url));

for (let file of fs.readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) continue;

  let name = /^[^\.]*/.exec(file)[0];
  describe(name, () => {
    for (let { name, run } of fileTests(
      fs.readFileSync(path.join(caseDir, file), "utf8"),
      file
    ))
      it(name, () => run(karolLanguage.parser));
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
        Schritt: function () {
          return ++j;
        },
        IstZiegel: function (val) {
          if (i < Number(val)) {
            i++;
            return true;
          } else {
            i = 0;
            return false;
          }
        },
      };
      for (let stmt of res(karolMethods)) {}
      assert.equal(39, j);
  });
});
