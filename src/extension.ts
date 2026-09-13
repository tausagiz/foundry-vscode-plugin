import * as vscode from 'vscode';
import { registerChatParticipant } from './chat/participant';
import { registerInlineCompletionProvider } from './completions/inlineProvider';
import { registerCodeActions } from './editing/codeActions';
import { FoundryLocalClient } from './foundryLocal/client';
import { ModelManager } from './foundryLocal/modelManager';
import { registerLanguageModelProvider } from './languageModel/provider';
import { applyProposedEditsToText, createWorkspaceEdit, parseProposedEdits } from './editing/editParser';
import { registerWorkspaceTools } from './tools/workspaceTools';
import { t } from './i18n';

export function activate(context: vscode.ExtensionContext): void {
  const modelManager = new ModelManager();
  const client = new FoundryLocalClient(modelManager);
  const output = vscode.window.createOutputChannel('Foundry Local');
  context.subscriptions.push(output);

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.command = 'foundryLocal.openMenu';
  let currentModelAlias: string | undefined;

  const updateInlineStatus = (): void => {
    const enabled = vscode.workspace.getConfiguration('foundryLocal').get<boolean>('inlineCompletions', true);
    const tr = t();
    const modelSuffix = currentModelAlias ? ` · ${currentModelAlias}` : '';
    status.text = `$(sparkle) Foundry Local · Inline ${enabled ? 'ON' : 'OFF'}${modelSuffix}`;
    const baseTooltip = enabled ? tr.statusBarActive : tr.statusBarDisabled;
    const modelInfo = currentModelAlias ? ` (model: ${currentModelAlias})` : '';
    status.tooltip = `${baseTooltip}${modelInfo}. ${tr.clickToOpenMenu}`;
  };

  updateInlineStatus();
  status.show();
  context.subscriptions.push(status);

  registerLanguageModelProvider(context, client, modelManager);
  registerWorkspaceTools(context);
  registerChatParticipant(context, client);
  registerInlineCompletionProvider(context, client, output);
  registerCodeActions(context);

  void (async () => {
    try {
      const cancellation = new vscode.CancellationTokenSource();
      currentModelAlias = await modelManager.ensureDefaultModel(cancellation.token);
      cancellation.dispose();
      updateInlineStatus();
    } catch {
      // No model resolved yet
    }
  })();

  context.subscriptions.push(
    vscode.commands.registerCommand('foundryLocal.openMenu', async () => {
      const tr = t();
      const enabled = vscode.workspace.getConfiguration('foundryLocal').get<boolean>('inlineCompletions', true);

      const items: (vscode.QuickPickItem & { action: string })[] = [
        {
          label: tr.openChatLabel,
          description: '',
          detail: tr.openChatDetail,
          action: 'chat'
        },
        {
          label: tr.selectModelLabel,
          description: currentModelAlias ? `[${currentModelAlias}]` : '',
          detail: tr.selectModelDetail,
          action: 'model'
        },
        {
          label: tr.selectModeLabel,
          description: '',
          detail: tr.selectModeDetail,
          action: 'mode'
        },
        {
          label: tr.toggleCompletionsLabel,
          description: enabled ? 'ON' : 'OFF',
          detail: enabled ? tr.toggleCompletionsDetailOn : tr.toggleCompletionsDetailOff,
          action: 'toggle'
        },
        {
          label: tr.configureParamsLabel,
          description: '',
          detail: tr.configureParamsDetail,
          action: 'configure'
        },
        {
          label: tr.showOutputLabel,
          description: '',
          detail: tr.showOutputDetail,
          action: 'output'
        }
      ];

      const selected = await vscode.window.showQuickPick(items, {
        title: tr.menuTitle,
        placeHolder: tr.clickToOpenMenu
      });

      if (!selected) {
        return;
      }

      switch (selected.action) {
        case 'chat':
          await vscode.commands.executeCommand('foundryLocal.openChat');
          break;
        case 'model':
          await vscode.commands.executeCommand('foundryLocal.selectModel');
          break;
        case 'mode':
          await vscode.commands.executeCommand('foundryLocal.selectMode');
          break;
        case 'toggle':
          await vscode.commands.executeCommand('foundryLocal.toggleInlineCompletions');
          break;
        case 'configure':
          await vscode.commands.executeCommand('foundryLocal.configureParameters');
          break;
        case 'output':
          vscode.commands.executeCommand('foundryLocal.showOutput');
          break;
      }
    }),

    vscode.commands.registerCommand('foundryLocal.openChat', async () => {
      const tr = t();
      try {
        status.text = '$(sync~spin) Foundry Local · Loading';
        status.tooltip = tr.loadingModel;
        const cancellation = new vscode.CancellationTokenSource();
        const alias = await modelManager.ensureDefaultModel(cancellation.token);
        cancellation.dispose();
        currentModelAlias = alias;
        await vscode.commands.executeCommand('workbench.action.chat.open', {
          query: `@foundry-local ${alias ? '' : ' '}`,
          isPartialQuery: true
        });
        updateInlineStatus();
      } catch (error) {
        status.text = '$(error) Foundry Local';
        status.tooltip = error instanceof Error ? error.message : String(error);
        await vscode.window.showErrorMessage(status.tooltip);
      }
    }),

    vscode.commands.registerCommand('foundryLocal.selectMode', async () => {
      const tr = t();
      const modes: (vscode.QuickPickItem & { command: string })[] = [
        { label: tr.modeAskTitle, detail: tr.modeAskDesc, command: 'ask' },
        { label: tr.modePlanTitle, detail: tr.modePlanDesc, command: 'plan' },
        { label: tr.modeAgentTitle, detail: tr.modeAgentDesc, command: 'agent' },
        { label: tr.modeExplainTitle, detail: tr.modeExplainDesc, command: 'explain' },
        { label: tr.modeFixTitle, detail: tr.modeFixDesc, command: 'fix' },
        { label: tr.modeRefactorTitle, detail: tr.modeRefactorDesc, command: 'refactor' },
        { label: tr.modeTestsTitle, detail: tr.modeTestsDesc, command: 'tests' }
      ];

      const selected = await vscode.window.showQuickPick(modes, {
        title: tr.selectModeTitle
      });

      if (selected) {
        await vscode.commands.executeCommand('workbench.action.chat.open', {
          query: `@foundry-local /${selected.command} `,
          isPartialQuery: true
        });
      }
    }),

    vscode.commands.registerCommand('foundryLocal.configureParameters', async () => {
      const tr = t();
      const config = vscode.workspace.getConfiguration('foundryLocal');

      const params: (vscode.QuickPickItem & { key: string; isFloat?: boolean })[] = [
        {
          label: tr.paramTemperatureTitle,
          description: String(config.get<number>('temperature', 0.2)),
          detail: tr.paramTemperatureDesc,
          key: 'temperature',
          isFloat: true
        },
        {
          label: tr.paramMaxTokensTitle,
          description: String(config.get<number>('maxOutputTokens', 512)),
          detail: tr.paramMaxTokensDesc,
          key: 'maxOutputTokens'
        },
        {
          label: tr.paramMaxContextTitle,
          description: String(config.get<number>('maxContextCharacters', 24000)),
          detail: tr.paramMaxContextDesc,
          key: 'maxContextCharacters'
        },
        {
          label: tr.paramDebounceTitle,
          description: String(config.get<number>('inlineDebounceMs', 120)),
          detail: tr.paramDebounceDesc,
          key: 'inlineDebounceMs'
        }
      ];

      const selected = await vscode.window.showQuickPick(params, {
        title: tr.configureParamsTitle
      });

      if (!selected) {
        return;
      }

      const currentValue = String(config.get<number>(selected.key));
      const prompt = tr.promptEnterValue.replace('{0}', selected.label).replace('{1}', currentValue);
      const input = await vscode.window.showInputBox({
        prompt,
        value: currentValue,
        validateInput: text => {
          const num = selected.isFloat ? parseFloat(text) : parseInt(text, 10);
          if (isNaN(num)) {
            return tr.invalidNumber;
          }
          return null;
        }
      });

      if (input !== undefined) {
        const newValue = selected.isFloat ? parseFloat(input) : parseInt(input, 10);
        await config.update(selected.key, newValue, vscode.ConfigurationTarget.Global);
        const msg = tr.valueUpdated.replace('{0}', selected.label).replace('{1}', String(newValue));
        await vscode.window.showInformationMessage(msg);
      }
    }),

    vscode.commands.registerCommand('foundryLocal.toggleInlineCompletions', async () => {
      const configuration = vscode.workspace.getConfiguration('foundryLocal');
      const enabled = configuration.get<boolean>('inlineCompletions', true);
      await configuration.update('inlineCompletions', !enabled, vscode.ConfigurationTarget.Global);
      updateInlineStatus();
      output.appendLine(`[settings] inline completions ${!enabled ? 'enabled' : 'disabled'}`);
      await vscode.window.showInformationMessage(`Foundry Local inline completions ${!enabled ? 'enabled' : 'disabled'}.`);
    }),

    vscode.commands.registerCommand('foundryLocal.showOutput', () => {
      output.show(true);
    }),

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
      const tr = t();
      const models = await modelManager.listModels();
      const selected = await vscode.window.showQuickPick(models.map(model => ({
        label: model.alias,
        description: model.cached ? 'Cached' : 'Available for download',
        detail: `${model.capabilities ?? 'No capabilities reported'}${model.loaded ? ' | loaded' : ''}`,
        alias: model.alias
      })), { placeHolder: tr.selectModelLabel });
      if (selected) {
        await vscode.workspace.getConfiguration('foundryLocal').update(
          'modelAlias', selected.alias,
          vscode.ConfigurationTarget.Global
        );
        currentModelAlias = selected.alias;
        updateInlineStatus();
        const msg = tr.modelSetTo.replace('{0}', selected.alias);
        await vscode.window.showInformationMessage(msg);
      }
    })
  );

  context.subscriptions.push({ dispose: () => { void modelManager.dispose(); } });
}

export function deactivate(): void {}