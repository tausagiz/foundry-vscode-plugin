# Foundry Local Copilot

VS Code extension for local coding assistance powered by Microsoft Foundry Local.

## Current MVP

- `@foundry-local` chat participant with `ask`, `plan`, `explain`, `fix`, `refactor`, `tests` and `agent` modes
- local streaming chat responses
- inline code completions
- `Explain with Foundry Local` action for a selection
- editor context with the active file, selection and diagnostics
- automatic SDK model download when `foundryLocal.autoDownload` is enabled
- read-only agent tools for workspace files, search and diagnostics
- confirmation-gated multi-file edit proposals
- confirmation-gated `npm test` and `npm run compile` workspace tasks
- confirmation-gated allowlisted commands: `npm test`, `npm run compile` and `git status --short`
- `/agent` tool-calling workflow through the VS Code chat utility API

## Requirements

- Windows
- VS Code 1.100 or newer
- Node.js 20 or newer for installing dependencies and building the extension
- Microsoft Foundry Local runtime and at least one locally available model

On Windows, install the runtimes with:

```powershell
winget install --id OpenJS.NodeJS.LTS --exact
```

The extension uses the `foundry-local-sdk-winml` package for the Windows native runtime and `foundry-local-sdk` for the typed JavaScript API. `azd` is not required for this extension.

## Development

```powershell
npm install
npm run compile
```

Press `F5` to launch an Extension Development Host. The default model is `qwen2.5-coder-0.5b`; change it with `foundryLocal.modelAlias` if needed. When `foundryLocal.autoDownload` is enabled, the SDK downloads a model that is not present in its own cache on first use.

## Use The Extension

For a packaged installation, download the latest `.vsix` from the repository's [Releases](https://github.com/tausagiz/foundry-vscode-plugin/releases) page, then in VS Code run **Extensions: Install from VSIX...**. For a local build, run `npm run package` and install the generated `foundry-local-copilot-<version>.vsix`. After restarting VS Code:

1. Start Foundry Local.
2. Click **Foundry Local** in the status bar, or run **Foundry Local: Open Chat** from the Command Palette.
3. The first available local chat model is selected automatically unless `foundryLocal.modelAlias` is set.
4. Use `/ask` for normal questions, `/plan` for a read-only implementation plan, or `/agent` when the request needs workspace inspection and confirmed actions. `/explain`, `/fix`, `/refactor` and `/tests` remain available for focused coding requests.

Select code and use the editor context menu for **Explain Selection** or **Fix Selection**. Fixes always open a diff before they can be applied. Inline suggestions are enabled by default.

The status bar shows `Foundry Local · Inline ON/OFF`. Suggestions produced by this extension are logged in the **Foundry Local** Output channel and include **Show Foundry Local completion source** after acceptance. Use **Foundry Local: Toggle Inline Completions** to compare behavior with other completion providers without changing GitHub Copilot settings.

The extension sends prompts to the local Foundry Local runtime. It does not intentionally send source code to Azure or collect prompt telemetry.

Workspace tools are limited to the open workspace. Reading and searching do not modify files. Edit proposals and validation tasks require explicit confirmation. Arbitrary terminal execution is not enabled yet.

## Releases

The source code is available at [github.com/tausagiz/foundry-vscode-plugin](https://github.com/tausagiz/foundry-vscode-plugin). To prepare a new VSIX release:

1. Update the version in `package.json` and keep the root version in `package-lock.json` synchronized.
2. Run `npm ci`, `npm run compile`, `npm test`, `npm run package`, and `npm audit --omit=dev` on Windows.
3. Inspect the generated package with `npx vsce ls --tree` and verify that it contains no local settings, secrets, model files, or generated development artifacts.
4. Test the newly generated versioned VSIX in a clean VS Code profile.
5. Publish the VSIX and release notes from the repository's [Releases](https://github.com/tausagiz/foundry-vscode-plugin/releases) page.
