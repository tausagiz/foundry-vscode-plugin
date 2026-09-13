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
    return candidate as ProposedEdit;
  });
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