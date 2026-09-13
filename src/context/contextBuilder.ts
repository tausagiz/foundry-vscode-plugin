import * as vscode from 'vscode';

export function buildEditorContext(): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return 'No editor is currently active.';
  }

  const selection = editor.selection;
  const source = selection.isEmpty
    ? editor.document.getText(new vscode.Range(
        Math.max(0, selection.active.line - 40),
        0,
        Math.min(editor.document.lineCount, selection.active.line + 40),
        0
      ))
    : editor.document.getText(selection);

  const diagnostics = vscode.languages.getDiagnostics(editor.document.uri)
    .slice(0, 20)
    .map(diagnostic => `${diagnostic.severity}: ${diagnostic.message}`)
    .join('\n');

  return [
    `File: ${vscode.workspace.asRelativePath(editor.document.uri)}`,
    `Language: ${editor.document.languageId}`,
    'Code:',
    '```',
    source,
    '```',
    diagnostics ? `Diagnostics:\n${diagnostics}` : ''
  ].filter(Boolean).join('\n');
}