const assert = require('node:assert/strict');
const vscode = require('vscode');
const { describe, it } = require('mocha');

describe('Foundry Local Copilot extension', () => {
  it('is installed and can activate', async () => {
    const extension = vscode.extensions.getExtension('local-development.foundry-local-copilot');
    assert.ok(extension, 'The extension should be available in the Extension Development Host');

    await extension.activate();
    assert.equal(extension.isActive, true);

    const toolNames = vscode.lm.tools.map(tool => tool.name);
    assert.deepEqual(
      toolNames.filter(name => name.startsWith('foundryLocal_')).sort(),
      [
        'foundryLocal_getDiagnostics',
        'foundryLocal_proposeEdits',
        'foundryLocal_readFile',
        'foundryLocal_runTests',
        'foundryLocal_searchWorkspace'
      ]
    );
  });
});