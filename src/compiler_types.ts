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
export type KarolError = { msg: string; pos: Position };
export type DefinitionCompilationResult = { result: string; identifier: string }