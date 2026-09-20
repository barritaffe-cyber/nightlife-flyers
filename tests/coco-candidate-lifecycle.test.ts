import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync('app/page.tsx', 'utf8');
const parsed = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

test('candidate component identity survives parent updates and preserves async font state', () => {
  const declarations: ts.FunctionDeclaration[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'CocoCanvasCandidateDebug') declarations.push(node);
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.equal(declarations.length, 1);
  assert.equal(declarations[0].parent, parsed,
    'A nested component remounts on every Page update, resetting font and composition guards');
});

test('compiled canvas ownership gates both scheduled and delayed composition commits', () => {
  const schedule = source.slice(source.indexOf('const canBuildCocoSubjectComposition =')).split(';')[0];
  assert.match(schedule, /!hasCocoCompiledCanvas\(useFlyerState.getState\(\).session\?\.\[format\]\)/);
  const commit = source.slice(source.indexOf('const applyCocoCanvasComposition ='), source.indexOf('const applyCocoCanvasComposition =') + 600);
  assert.match(commit, /if \(hasCocoCompiledCanvas\(useFlyerState.getState\(\).session\?\.\[format\]\)\) return/);
});
