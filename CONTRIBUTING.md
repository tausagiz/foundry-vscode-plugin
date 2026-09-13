# Contributing

## Development setup

This extension targets Windows because the Foundry Local native runtime is Windows-specific.

```powershell
npm ci
npm run compile
npm test
```

Press `F5` in VS Code to launch the Extension Development Host. A locally available Foundry Local model is required for manual inference checks.

## Before opening a pull request

Run all of the following from the repository root:

```powershell
npm run compile
npm test
npm run package
npm audit --omit=dev
```

The audit currently reports a transitive `adm-zip` advisory from the Foundry Local SDK. Do not hide or suppress that result; include its status in the pull request when dependencies are changed.

Changes to chat commands, language-model tools, activation, manifest metadata, or confirmation gates require focused tests. Keep generated `dist/` and `.vsix` files out of commits.

## Pull requests

Describe the user-visible behavior, tests run, and any known dependency or platform limitations. Keep changes focused and do not commit secrets, model files, local configuration, or workspace-specific paths.