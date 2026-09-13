# Foundry Local Copilot

VS Code extension for local coding assistance powered by Microsoft Foundry Local.

## Current MVP

- `@foundry-local` chat participant with `/explain` and `/fix` commands
- local streaming chat responses
- inline code completions
- `Explain with Foundry Local` action for a selection
- editor context with the active file, selection and diagnostics

## Requirements

- Windows
- VS Code 1.100 or newer
- Node.js 20 or newer for installing dependencies and building the extension
- Microsoft Foundry Local runtime and at least one locally available model

The current machine does not have Node.js or `azd` available in `PATH`. Install Node.js before running `npm install` and building the extension. `azd` is only required by the broader Foundry deployment tooling and is not required for the local runtime MVP.

## Development

```powershell
npm install
npm run compile
```

Press `F5` to launch an Extension Development Host. Configure the model alias in VS Code settings under `foundryLocal.modelAlias`, or leave it empty to use the first model returned by the local catalog.

The extension sends prompts to the local Foundry Local runtime. It does not intentionally send source code to Azure or collect prompt telemetry.