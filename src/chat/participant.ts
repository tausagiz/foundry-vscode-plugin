import * as vscode from 'vscode';
import { buildEditorContext } from '../context/contextBuilder';
import { FoundryLocalClient } from '../foundryLocal/client';

export function registerChatParticipant(
  context: vscode.ExtensionContext,
  client: FoundryLocalClient
): vscode.ChatParticipant {
  const participant = vscode.chat.createChatParticipant(
    'foundry-local-copilot.participant',
    async (request, chatContext, response, token) => {
      const history = chatContext.history
        .filter(item => item instanceof vscode.ChatRequestTurn)
        .slice(-6)
        .map(item => `User: ${item.prompt}`)
        .join('\n');
      const configuration = vscode.workspace.getConfiguration('foundryLocal');
      const editorContext = buildEditorContext(
        configuration.get<number>('maxContextCharacters', 24000)
      );
      const commandInstruction = request.command
        ? `The requested operation is: ${request.command}.`
        : '';

      response.progress('Loading the local Foundry model...');

      try {
        const messages = [
          {
            role: 'system' as const,
            content: 'You are a precise local coding assistant. Prefer concise answers and preserve the user code style.'
          },
          {
            role: 'user' as const,
            content: [
              commandInstruction,
              history ? `Recent conversation:\n${history}` : '',
              `Workspace context:\n${editorContext}`,
              `Request:\n${request.prompt}`
            ].filter(Boolean).join('\n\n')
          }
        ];

        for await (const chunk of client.stream(messages, configuration, token)) {
          response.markdown(chunk);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        response.markdown(`Unable to use Foundry Local: ${message}`);
      }

      return {};
    }
  );

  participant.iconPath = new vscode.ThemeIcon('chip');
  context.subscriptions.push(participant);
  return participant;
}