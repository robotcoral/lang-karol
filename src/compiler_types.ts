export const callIdentifiers = [
  "Schritt",
  "LinksDrehen",
  "RechtsDrehen",
  "Hinlegen",
  "Aufheben",
  "MarkeSetzen",
  "MarkeLöschen",
  "Warten",
  "Ton",
  "Beenden",
];

export const conditionIdentifiers = [
  "IstWand",
  "NichtIstWand",
  "IstZiegel",
  "NichtIstZiegel",
  "IstMarke",
  "NichtIstMarke",
  "IstNorden",
  "IstOsten",
  "IstSüden",
  "IstWesten",
  "IstVoll",
  "NichtIstVoll",
  "IstLeer",
  "NichtIstLeer",
  "HatZiegel",
];

export type Position = { from: number; to: number };

export type KarolError = { kind: "error"; msg: string; pos: Position };

export type CompilationResult =
  | { kind: "success"; result: GeneratorFunction }
  | KarolError;

export type DefinitionCompilationResult =
  | { kind: "success"; result: string; identifier: string }
  | KarolError;

export type InnerCompilationResult =
  | { kind: "success"; result: string }
  | KarolError;

export type ExecutionResult = { kind: "success" } | KarolError;
