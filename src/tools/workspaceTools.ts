import * as vscode from 'vscode';

type ReadFileInput = {
  path: string;
};

type SearchWorkspaceInput = {
  query: string;
  include?: string;
  maxResults?: number;
};

type DiagnosticsInput = {
  path?: string;
};

export function registerWorkspaceTools(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.lm.registerTool<ReadFileInput>('foundryLocal_readFile', {
      prepareInvocation(options) {
        return { invocationMessage: `Reading ${options.input.path}` };
      },
      async invoke(options, token) {
        const uri = resolveWorkspacePath(options.input.path);
        if (token.isCancellationRequested) {
          return new vscode.LanguageModelToolResult([vscode.LanguageModelDataPart.json({ cancelled: true })]);
        }
        const bytes = await vscode.workspace.fs.readFile(uri);
        const text = new TextDecoder().decode(bytes);
        return new vscode.LanguageModelToolResult([
          vscode.LanguageModelDataPart.text(text.slice(0, 50000))
        ]);
      }
    }),
    vscode.lm.registerTool<SearchWorkspaceInput>('foundryLocal_searchWorkspace', {
      prepareInvocation(options) {
        return { invocationMessage: `Searching workspace for ${options.input.query}` };
      },
      async invoke(options, token) {
        const query = options.input.query.trim().toLowerCase();
        if (!query) {
          throw new Error('Search query cannot be empty.');
        }
        const maxResults = Math.min(Math.max(options.input.maxResults ?? 30, 1), 100);
        const files = await vscode.workspace.findFiles(
          options.input.include || '**/*',
          '**/{node_modules,.git,dist,.vscode-test}/**',
          200,
          token
        );
        const matches: string[] = [];
        for (const file of files) {
          if (token.isCancellationRequested || matches.length >= maxResults) {
            break;
          }
          const content = new TextDecoder().decode(await vscode.workspace.fs.readFile(file));
          content.split(/\r?\n/).forEach((line, index) => {
            if (matches.length < maxResults && line.toLowerCase().includes(query)) {
              matches.push(`${vscode.workspace.asRelativePath(file)}:${index + 1}: ${line.trim().slice(0, 500)}`);
            }
          });
        }
        return new vscode.LanguageModelToolResult([
          vscode.LanguageModelDataPart.text(matches.length ? matches.join('\n') : 'No matches found.')
        ]);
      }
    }),
    vscode.lm.registerTool<DiagnosticsInput>('foundryLocal_getDiagnostics', {
      prepareInvocation(options) {
        return { invocationMessage: `Reading diagnostics${options.input.path ? ` for ${options.input.path}` : ''}` };
      },
      async invoke(options) {
        const uri = options.input.path
          ? resolveWorkspacePath(options.input.path)
          : vscode.window.activeTextEditor?.document.uri;
        if (!uri) {
          return new vscode.LanguageModelToolResult([
            vscode.LanguageModelDataPart.text('No active editor and no path was provided.')
          ]);
        }
        const diagnostics = vscode.languages.getDiagnostics(uri).map(diagnostic => ({
          severity: diagnostic.severity,
          message: diagnostic.message,
          start: diagnostic.range.start,
          end: diagnostic.range.end,
          source: diagnostic.source
        }));
        return new vscode.LanguageModelToolResult([
          vscode.LanguageModelDataPart.json({ path: vscode.workspace.asRelativePath(uri), diagnostics })
        ]);
      }
    })
  );
}

function resolveWorkspacePath(path: string): vscode.Uri {
  const folders = vscode.workspace.workspaceFolders ?? [];
  if (!folders.length) {
    throw new Error('Open a workspace before using workspace tools.');
  }

  const normalized = path.replace(/^[\\/]+/, '');
  const folder = folders[0];
  const uri = vscode.Uri.joinPath(folder.uri, normalized);
  const target = uri.fsPath.toLowerCase();
  const root = folder.uri.fsPath.toLowerCase().replace(/[\\/]$/, '') + '\\';
  if (!target.startsWith(root)) {
    throw new Error('The requested path is outside the workspace.');
  }
  return uri;
}