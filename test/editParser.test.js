const assert = require('node:assert/strict');
const { describe, it } = require('mocha');

describe('structured edit parser', () => {
  it('parses an edit embedded in model text', () => {
    const { parseProposedEdits } = require('../dist/editing/editParser');
    const edits = parseProposedEdits('Here is the proposal: {"edits":[{"uri":"file:///workspace/a.ts","start":{"line":0,"character":0},"end":{"line":0,"character":1},"newText":"x"}]}');
    assert.equal(edits.length, 1);
    assert.equal(edits[0].newText, 'x');
  });

  it('rejects incomplete edit objects', () => {
    const { parseProposedEdits } = require('../dist/editing/editParser');
    assert.throws(() => parseProposedEdits('{"edits":[{"uri":"file:///workspace/a.ts"}]}'));
  });

  it('rejects reversed or negative ranges', () => {
    const { parseProposedEdits } = require('../dist/editing/editParser');
    assert.throws(() => parseProposedEdits('{"edits":[{"uri":"file:///workspace/a.ts","start":{"line":2,"character":0},"end":{"line":1,"character":0},"newText":"x"}]}'));
    assert.throws(() => parseProposedEdits('{"edits":[{"uri":"file:///workspace/a.ts","start":{"line":-1,"character":0},"end":{"line":0,"character":0},"newText":"x"}]}'));
  });
});