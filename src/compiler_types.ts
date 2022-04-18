import { TreeCursor } from "@lezer/common";

export const callIdentifiers = [
  "schritt",
  "linksdrehen",
  "rechtsdrehen",
  "hinlegen",
  "aufheben",
  "markesetzen",
  "markelöschen",
  "warten",
  "ton",
  "beenden",
];

export const conditionIdentifiers = [
  "istwand",
  "nichtistwand",
  "istziegel",
  "nichtistziegel",
  "istmarke",
  "nichtistmarke",
  "istnorden",
  "istosten",
  "istsüden",
  "istwesten",
  "istvoll",
  "nichtistvoll",
  "istleer",
  "nichtistleer",
  "hatziegel",
];

export type Position = { from: number; to: number };
export type DefinitionCompilationResult = { result: string; identifier: string }
export type CondCompilationResult = { result: string, inv: boolean }
export type TreeData = { str: string, cursor: TreeCursor}