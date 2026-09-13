import * as vscode from 'vscode';
import { FoundryLocalClient } from '../foundryLocal/client';

export function registerInlineCompletionProvider(
  context: vscode.ExtensionContext,
  client: FoundryLocalClient
): void {
  const provider: vscode.InlineCompletionItemProvider = {
    async provideInlineCompletionItems(document, position, completionContext, token) {
      const configuration = vscode.workspace.getConfiguration('foundryLocal', document.uri);
      if (!configuration.get<boolean>('inlineCompletions', true) || token.isCancellationRequested) {
        return [];
      }

      const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
      if (!linePrefix.trim()) {
        return [];
      }

      const startLine = Math.max(0, position.line - 20);
      const endLine = Math.min(document.lineCount, position.line + 5);
      const nearbyCode = document.getText(new vscode.Range(startLine, 0, endLine, 0));
      const messages = [
        {
          role: 'system' as const,
          content: 'Complete the code. Return only the code to insert, without markdown or explanation.'
        },
        {
          role: 'user' as const,
          content: `Language: ${document.languageId}\nCode:\n${nearbyCode}`
        }
      ];

      let completion = '';
      for await (const chunk of client.stream(messages, configuration, token)) {
        completion += chunk;
        if (completion.length >= 800) {
          break;
        }
      }

      const cleaned = completion
        .replace(/^```[\w-]*\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      if (!cleaned || token.isCancellationRequested || completionContext.triggerKind === vscode.InlineCompletionTriggerKind.Automatic && cleaned.includes('\n\n')) {
        return [];
      }

      return [new vscode.InlineCompletionItem(cleaned, new vscode.Range(position, position))];
    }
  };

  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider({ scheme: 'file' }, provider)
  );
}