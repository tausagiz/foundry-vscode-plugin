import * as vscode from 'vscode';
import { ModelManager } from './modelManager';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export class FoundryLocalClient {
  constructor(private readonly modelManager: ModelManager) {}

  async *stream(
    messages: ChatMessage[],
    configuration: vscode.WorkspaceConfiguration,
    token: vscode.CancellationToken
  ): AsyncIterable<string> {
    const modelAlias = configuration.get<string>('modelAlias', '');
    const selectedAlias = modelAlias || await this.modelManager.ensureDefaultModel(token);
    const model = await this.modelManager.ensureLoaded(selectedAlias, token);
    const chatClient = model.createChatClient();
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

  async complete(
    messages: ChatMessage[],
    configuration: vscode.WorkspaceConfiguration,
    token: vscode.CancellationToken
  ): Promise<string> {
    let result = '';
    for await (const chunk of this.stream(messages, configuration, token)) {
      result += chunk;
    }
    return result;
  }
}