import * as vscode from 'vscode';
import { registerChatParticipant } from './chat/participant';
import { registerInlineCompletionProvider } from './completions/inlineProvider';
import { registerCodeActions } from './editing/codeActions';
import { FoundryLocalClient } from './foundryLocal/client';
import { ModelManager } from './foundryLocal/modelManager';
import { registerLanguageModelProvider } from './languageModel/provider';
import { applyProposedEditsToText, createWorkspaceEdit, parseProposedEdits } from './editing/editParser';
import { registerWorkspaceTools } from './tools/workspaceTools';

export function activate(context: vscode.ExtensionContext): void {
  const modelManager = new ModelManager();
  const client = new FoundryLocalClient(modelManager);
  registerLanguageModelProvider(context, client, modelManager);
  registerWorkspaceTools(context);
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
    }),
    vscode.commands.registerCommand('foundryLocal.fixSelection', async (uri?: vscode.Uri, range?: vscode.Range) => {
      const editor = vscode.window.activeTextEditor;
      const targetUri = uri ?? editor?.document.uri;
      const targetRange = range ?? editor?.selection;
      if (!targetUri || !targetRange || targetRange.isEmpty) {
        return;
      }

      const document = await vscode.workspace.openTextDocument(targetUri);
      const configuration = vscode.workspace.getConfiguration('foundryLocal', targetUri);
      const prompt = [
        'Return only valid JSON in this exact shape: {"edits":[{"uri":"file:///absolute/path","start":{"line":0,"character":0},"end":{"line":0,"character":0},"newText":"..."}]}',
        'Fix the selected code. Preserve the surrounding style.',
        `File: ${vscode.workspace.asRelativePath(targetUri)}`,
        'Selected code:',
        document.getText(targetRange)
      ].join('\n');
      const messages = [
        { role: 'system' as const, content: 'You produce safe, minimal code edits as strict JSON.' },
        { role: 'user' as const, content: prompt }
      ];

      try {
        const cancellation = new vscode.CancellationTokenSource();
        const result = await client.complete(messages, configuration, cancellation.token);
        cancellation.dispose();
        const proposedEdits = parseProposedEdits(result);
        const workspaceEdit = createWorkspaceEdit(proposedEdits);
        const proposedText = applyProposedEditsToText(document, proposedEdits);
        const previewDocument = await vscode.workspace.openTextDocument({
          language: document.languageId,
          content: proposedText
        });
        await vscode.commands.executeCommand(
          'vscode.diff',
          targetUri,
          previewDocument.uri,
          'Foundry Local proposed changes'
        );
        const choice = await vscode.window.showInformationMessage(
          'Review the diff, then choose whether to apply the Foundry Local changes.',
          { modal: true },
          'Apply'
        );
        if (choice === 'Apply') {
          await vscode.workspace.applyEdit(workspaceEdit, { isRefactoring: true });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await vscode.window.showErrorMessage(`Foundry Local could not create an edit: ${message}`);
      }
    }),
    vscode.commands.registerCommand('foundryLocal.selectModel', async () => {
      const models = await modelManager.listModels();
      const selected = await vscode.window.showQuickPick(models.map(model => ({
        label: model.alias,
        description: model.cached ? 'Cached' : 'Available for download',
        detail: `${model.capabilities ?? 'No capabilities reported'}${model.loaded ? ' | loaded' : ''}`,
        alias: model.alias
      })), { placeHolder: 'Select a Foundry Local model' });
      if (selected) {
        await vscode.workspace.getConfiguration('foundryLocal').update(
          'modelAlias', selected.alias,
          vscode.ConfigurationTarget.Global
        );
        await vscode.window.showInformationMessage(`Foundry Local model set to ${selected.alias}.`);
      }
    })
  );
  context.subscriptions.push({ dispose: () => { void modelManager.dispose(); } });
}

export function deactivate(): void {}