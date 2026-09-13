import * as vscode from 'vscode';
import { FoundryLocalClient } from '../foundryLocal/client';
import { ModelManager } from '../foundryLocal/modelManager';

export function registerLanguageModelProvider(
  context: vscode.ExtensionContext,
  client: FoundryLocalClient,
  modelManager: ModelManager
): void {
  const provider: vscode.LanguageModelChatProvider<vscode.LanguageModelChatInformation> = {
    async provideLanguageModelChatInformation() {
      const models = await modelManager.listModels();
      return models.map(model => ({
        id: model.alias,
        name: model.alias,
        family: 'foundry-local-copilot',
        version: model.id,
        maxInputTokens: 32000,
        maxOutputTokens: 4096,
        capabilities: { toolCalling: false },
        detail: model.cached ? 'Local and cached' : 'Local model; download on first use'
      }));
    },

    async provideLanguageModelChatResponse(
      model,
      messages,
      options,
      progress,
      token
    ) {
      const configuration = vscode.workspace.getConfiguration('foundryLocal');
      const requestMessages = messages.map(message => ({
        role: message.role === vscode.LanguageModelChatMessageRole.Assistant ? 'assistant' as const : 'user' as const,
        content: message.content
          .filter(part => part instanceof vscode.LanguageModelTextPart)
          .map(part => (part as vscode.LanguageModelTextPart).value)
          .join('')
      }));

      for await (const text of client.stream(
        requestMessages,
        configuration,
        token
      )) {
        progress.report(new vscode.LanguageModelTextPart(text));
      }
    },

    async provideTokenCount(_model, text) {
      return typeof text === 'string' ? text.length : JSON.stringify(text).length;
    }
  };

  context.subscriptions.push(
    vscode.lm.registerLanguageModelChatProvider('local-development.foundry-local-copilot', provider)
  );
}