import type * as vscode from 'vscode';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type FoundryModel = {
  alias?: string;
  id?: string;
  load(): Promise<void>;
  createChatClient(options?: { temperature?: number; maxTokens?: number }): FoundryChatClient;
};

type FoundryChatClient = {
  completeStreamingChat(messages: ChatMessage[]): AsyncIterable<{
    choices?: Array<{ delta?: { content?: string } }>;
  }>;
};

type FoundryManager = {
  catalog: {
    getModels(): Promise<FoundryModel[]>;
    getModel(alias: string): Promise<FoundryModel | undefined>;
  };
};

export class FoundryLocalClient {
  private manager?: FoundryManager;
  private model?: FoundryModel;

  async initialize(modelAlias: string): Promise<string> {
    const sdk = await import('foundry-local-sdk-winml');
    this.manager = sdk.FoundryLocalManager.create({
      appName: 'foundry-local-copilot',
      logLevel: 'error'
    }) as FoundryManager;

    const models = await this.manager.catalog.getModels();
    const selected = modelAlias
      ? await this.manager.catalog.getModel(modelAlias)
      : models[0];

    if (!selected) {
      throw new Error('No Foundry Local model is available. Install a model and try again.');
    }

    await selected.load();
    this.model = selected;
    return selected.alias ?? selected.id ?? modelAlias;
  }

  async *stream(
    messages: ChatMessage[],
    configuration: vscode.WorkspaceConfiguration,
    token: vscode.CancellationToken
  ): AsyncIterable<string> {
    if (!this.model) {
      await this.initialize(configuration.get<string>('modelAlias', ''));
    }

    const chatClient = this.model!.createChatClient({
      temperature: configuration.get<number>('temperature', 0.2),
      maxTokens: configuration.get<number>('maxOutputTokens', 512)
    });

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