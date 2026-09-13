import * as vscode from 'vscode';
import { ModelManager } from '../foundryLocal/modelManager';

export function registerLanguageModelProvider(
  context: vscode.ExtensionContext,
  _client: unknown,
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
        capabilities: { toolCalling: true },
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
          .map(part => part instanceof vscode.LanguageModelTextPart
            ? part.value
            : JSON.stringify(part))
          .join('')
      }));

      const localModel = await modelManager.ensureLoaded(model.id, token);
      const chatClient = localModel.createChatClient();
      chatClient.settings.temperature = configuration.get<number>('temperature', 0.2);
      chatClient.settings.maxTokens = configuration.get<number>('maxOutputTokens', 512);
      const tools = options.tools?.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }));
      const toolCalls = new Map<number, { id: string; name: string; arguments: string }>();

      for await (const chunk of chatClient.completeStreamingChat(requestMessages, tools ?? [])) {
        if (token.isCancellationRequested) {
          return;
        }
        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) {
          progress.report(new vscode.LanguageModelTextPart(delta.content));
        }
        for (const call of delta?.tool_calls ?? []) {
          const current = toolCalls.get(call.index) ?? {
            id: call.id ?? `call-${call.index}`,
            name: call.function?.name ?? '',
            arguments: ''
          };
          current.arguments += call.function?.arguments ?? '';
          if (call.id) current.id = call.id;
          if (call.function?.name) current.name = call.function.name;
          toolCalls.set(call.index, current);
        }
      }

      for (const call of toolCalls.values()) {
        let input: object = {};
        try {
          input = JSON.parse(call.arguments || '{}') as object;
        } catch {
          input = { rawArguments: call.arguments };
        }
        progress.report(new vscode.LanguageModelToolCallPart(call.id, call.name, input));
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