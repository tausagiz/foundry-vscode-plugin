import * as vscode from 'vscode';
import * as chatUtils from '@vscode/chat-extension-utils';
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
      const modeInstructions: Record<string, string> = {
        ask: 'Answer the user directly. Explain the reasoning when it helps, but do not propose file changes unless the user asks for them.',
        plan: 'Create a clear, actionable implementation plan. Inspect the provided context, identify relevant files and risks, and do not modify files or claim that changes were made.',
        explain: 'Explain the requested code or selection with concise, concrete detail.',
        fix: 'Suggest a minimal fix for the requested code or diagnostics. Describe the proposed change, but do not apply edits in this mode.',
        refactor: 'Describe a focused refactoring for the requested code. Do not apply edits in this mode.',
        tests: 'Suggest focused tests for the requested code. Include important cases and expected behavior, but do not modify files in this mode.'
      };
      const modeInstruction = request.command
        ? modeInstructions[request.command] ?? `Follow the requested operation: ${request.command}.`
        : modeInstructions.ask;

      if (request.command === 'agent') {
        const agentRequest = chatUtils.sendChatParticipantRequest(
          request,
          chatContext,
          {
            model: request.model,
            prompt: [
              'You are a local coding agent. Use workspace tools to inspect files and diagnostics before proposing changes.',
              'Never make edits without using the confirmation-gated propose edits tool.',
              `Workspace context:\n${editorContext}`
            ].join('\n\n'),
            tools: vscode.lm.tools,
            responseStreamOptions: {
              stream: response,
              references: true,
              responseText: true
            },
            extensionMode: context.extensionMode
          },
          token
        );
        return await agentRequest.result;
      }

      response.progress('Loading the local Foundry model...');

      try {
        const messages = [
          {
            role: 'system' as const,
            content: [
              'You are a precise local coding assistant. Prefer concise answers and preserve the user code style.',
              `Current mode: ${request.command || 'ask'}.`,
              modeInstruction
            ].join('\n')
          },
          {
            role: 'user' as const,
            content: [
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