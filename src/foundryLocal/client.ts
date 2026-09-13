import * as vscode from 'vscode';
import type { FoundryLocalManager } from 'foundry-local-sdk' with { "resolution-mode": "import" };
import type { IModel } from 'foundry-local-sdk' with { "resolution-mode": "import" };

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export class FoundryLocalClient {
  private manager?: FoundryLocalManager;
  private model?: IModel;

  async initialize(modelAlias: string): Promise<string> {
    const sdk = await import('foundry-local-sdk');
    this.manager = await sdk.FoundryLocalManager.createAsync({
      appName: 'foundry-local-copilot',
      logLevel: 'error'
    });

    const models = await this.manager.catalog.getModels();
    const selected = modelAlias ? await this.manager.catalog.getModel(modelAlias) : models[0];

    if (!selected) {
      throw new Error('No Foundry Local model is available. Install a model and try again.');
    }

    if (!selected.isCached) {
      const autoDownload = vscode.workspace
        .getConfiguration('foundryLocal')
        .get<boolean>('autoDownload', true);
      if (!autoDownload) {
        throw new Error(`Model '${selected.alias}' is not in the SDK cache. Enable foundryLocal.autoDownload or download it first.`);
      }
      await selected.download();
    }

    await selected.load();
    this.model = selected;
    return selected.alias || selected.id || modelAlias;
  }

  async *stream(
    messages: ChatMessage[],
    configuration: vscode.WorkspaceConfiguration,
    token: vscode.CancellationToken
  ): AsyncIterable<string> {
    if (!this.model) {
      await this.initialize(configuration.get<string>('modelAlias', ''));
    }

    const chatClient = this.model!.createChatClient();
    chatClient.settings.temperature = configuration.get<number>('temperature', 0.2);
    chatClient.settings.maxTokens = configuration.get<number>('maxOutputTokens', 512);

    for await (const chunk of chatClient.completeStreamingChat(messages)) {
      if (token.isCancellationRequested) {
        return;
      }

      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}