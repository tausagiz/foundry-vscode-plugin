import * as vscode from 'vscode';
import { registerChatParticipant } from './chat/participant';
import { registerInlineCompletionProvider } from './completions/inlineProvider';
import { registerCodeActions } from './editing/codeActions';
import { FoundryLocalClient } from './foundryLocal/client';

export function activate(context: vscode.ExtensionContext): void {
  const client = new FoundryLocalClient();
  registerChatParticipant(context, client);
  registerInlineCompletionProvider(context, client);
  registerCodeActions(context);
  context.subscriptions.push(
    vscode.commands.registerCommand('foundryLocal.explainSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) {
        return;
      }

      await vscode.commands.executeCommand('workbench.action.chat.open', {
        query: `@foundry-local /explain Explain this selection:\n\n${editor.document.getText(editor.selection)}`
      });
    })
  );
}

export function deactivate(): void {}