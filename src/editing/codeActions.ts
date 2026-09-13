import * as vscode from 'vscode';

export function registerCodeActions(context: vscode.ExtensionContext): void {
  const provider: vscode.CodeActionProvider = {
    provideCodeActions(document, range) {
      if (range.isEmpty) {
        return [];
      }

      const explain = new vscode.CodeAction(
        'Explain with Foundry Local',
        vscode.CodeActionKind.QuickFix
      );
      explain.command = {
        command: 'foundryLocal.explainSelection',
        title: 'Explain with Foundry Local',
        arguments: [document.uri, range]
      };

      const fix = new vscode.CodeAction(
        'Fix with Foundry Local',
        vscode.CodeActionKind.QuickFix
      );
      fix.command = {
        command: 'foundryLocal.fixSelection',
        title: 'Fix with Foundry Local',
        arguments: [document.uri, range]
      };

      return [explain, fix];
    }
  };

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider({ scheme: 'file' }, provider, {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
    })
  );
}