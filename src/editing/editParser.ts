import * as vscode from 'vscode';

export type ProposedEdit = {
  uri: string;
  start: { line: number; character: number };
  end: { line: number; character: number };
  newText: string;
};

export function parseProposedEdits(value: string): ProposedEdit[] {
  const json = value.match(/\{[\s\S]*\}/)?.[0];
  if (!json) {
    throw new Error('The model did not return a JSON edit proposal.');
  }

  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { edits?: unknown }).edits)) {
    throw new Error('The edit proposal must contain an edits array.');
  }

  return (parsed as { edits: unknown[] }).edits.map((edit, index) => {
    if (!edit || typeof edit !== 'object') {
      throw new Error(`Edit ${index + 1} is not an object.`);
    }
    const candidate = edit as Partial<ProposedEdit>;
    if (typeof candidate.uri !== 'string' || typeof candidate.newText !== 'string' || !candidate.start || !candidate.end) {
      throw new Error(`Edit ${index + 1} is missing required fields.`);
    }
    if (!isPosition(candidate.start) || !isPosition(candidate.end) || comparePositions(candidate.start, candidate.end) > 0) {
      throw new Error(`Edit ${index + 1} has an invalid range.`);
    }
    return candidate as ProposedEdit;
  });
}

export function applyProposedEditsToText(
  document: vscode.TextDocument,
  edits: ProposedEdit[]
): string {
  const documentEdits = edits
    .filter(edit => edit.uri === document.uri.toString())
    .map(edit => ({
      start: document.offsetAt(document.validatePosition(new vscode.Position(edit.start.line, edit.start.character))),
      end: document.offsetAt(document.validatePosition(new vscode.Position(edit.end.line, edit.end.character))),
      newText: edit.newText
    }))
    .sort((left, right) => right.start - left.start);

  let content = document.getText();
  for (const edit of documentEdits) {
    content = `${content.slice(0, edit.start)}${edit.newText}${content.slice(edit.end)}`;
  }
  return content;
}

export function createWorkspaceEdit(edits: ProposedEdit[]): vscode.WorkspaceEdit {
  const workspaceEdit = new vscode.WorkspaceEdit();
  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];

  for (const edit of edits) {
    const uri = vscode.Uri.parse(edit.uri);
    if (uri.scheme !== 'file' || !workspaceFolders.some(folder => isInside(uri, folder.uri))) {
      throw new Error(`Edit path is outside the workspace: ${edit.uri}`);
    }
    const range = new vscode.Range(
      edit.start.line,
      edit.start.character,
      edit.end.line,
      edit.end.character
    );
    workspaceEdit.replace(uri, range, edit.newText);
  }

  return workspaceEdit;
}

function isInside(uri: vscode.Uri, folder: vscode.Uri): boolean {
  const filePath = uri.fsPath.toLowerCase();
  const folderPath = folder.fsPath.toLowerCase().replace(/[\\/]$/, '') + '\\';
  return filePath.startsWith(folderPath);
}

function isPosition(value: unknown): value is { line: number; character: number } {
  return Boolean(value) && typeof value === 'object'
    && Number.isInteger((value as { line?: unknown }).line)
    && Number.isInteger((value as { character?: unknown }).character)
    && (value as { line: number }).line >= 0
    && (value as { character: number }).character >= 0;
}

function comparePositions(
  left: { line: number; character: number },
  right: { line: number; character: number }
): number {
  return left.line - right.line || left.character - right.character;
}