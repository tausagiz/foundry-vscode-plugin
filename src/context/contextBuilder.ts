import * as vscode from 'vscode';

export function buildEditorContext(maxCharacters = 24000): string {
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

  const context = [
    `File: ${vscode.workspace.asRelativePath(editor.document.uri)}`,
    `Language: ${editor.document.languageId}`,
    'Code:',
    '```',
    source,
    '```',
    diagnostics ? `Diagnostics:\n${diagnostics}` : ''
  ].filter(Boolean).join('\n');

  return context.length <= maxCharacters
    ? context
    : `${context.slice(0, Math.max(0, maxCharacters - 80))}\n... [context truncated]`;
}