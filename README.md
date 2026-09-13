# Foundry Local Copilot

VS Code extension for local coding assistance powered by Microsoft Foundry Local.

## Current MVP

- `@foundry-local` chat participant with `/explain` and `/fix` commands
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
winget install --id Microsoft.Azd --exact
```

`azd` is only required by the broader Foundry deployment tooling and is not required for local inference itself. The extension uses the `foundry-local-sdk-winml` package for the Windows native runtime and `foundry-local-sdk` for the typed JavaScript API.

## Development

```powershell
npm install
npm run compile
```

Press `F5` to launch an Extension Development Host. The default model is `qwen2.5-coder-0.5b`; change it with `foundryLocal.modelAlias` if needed. When `foundryLocal.autoDownload` is enabled, the SDK downloads a model that is not present in its own cache on first use.

The extension sends prompts to the local Foundry Local runtime. It does not intentionally send source code to Azure or collect prompt telemetry.

Workspace tools are limited to the open workspace. Reading and searching do not modify files. Edit proposals and validation tasks require explicit confirmation. Arbitrary terminal execution is not enabled yet.