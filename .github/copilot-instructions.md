# Foundry Local Copilot Repository Instructions

## Project shape

- This is a VS Code extension written in TypeScript.
- Source code lives in `src/`; compiled output is generated in `dist/`.
- Extension metadata and chat participant slash commands are declared in `package.json` under `contributes.chatParticipants`.
- The chat participant implementation is in `src/chat/participant.ts`.
- Extension integration tests are in `test/` and run in a VS Code Extension Development Host.

## Validation commands

- Use `npm.cmd run compile` on Windows when PowerShell blocks `npm.ps1`.
- Run `npm.cmd test` after changes affecting activation, the manifest, chat participants, tools, or extension behavior.
- Run `npm.cmd run package` when a VSIX is needed. This runs the bundle step and creates a versioned `.vsix` file.
- Do not treat warnings emitted by VS Code or Electron as test failures when the test process exits successfully.

## Chat modes and slash commands

- Keep the slash command names consistent across `package.json`, `src/chat/participant.ts`, and `src/extension.ts`.
- The supported participant commands are `ask`, `plan`, `explain`, `fix`, `refactor`, `tests`, and `agent`.
- Any change to `contributes.chatParticipants.commands` must include or update a manifest regression test in `test/extension.test.js`.
- Verify the loaded extension manifest, not only TypeScript behavior, when a slash command is missing from the chat UI.

## Versioning and VSIX

- Bump the extension version in `package.json` for a user-facing VSIX update.
- Keep the root package metadata in `package-lock.json` synchronized with the extension version without changing dependency versions unnecessarily.
- Install the newly generated versioned VSIX when testing an update; do not rely on an older ignored `.vsix` artifact.
- Generated files such as `dist/` and `*.vsix` are ignored and should not be committed unless the task explicitly requires them.

## Editing and scope

- Prefer the smallest change that fixes the root cause and preserve existing public APIs.
- Do not reformat unrelated files or modify generated output by hand.
- Add focused tests for manifest and runtime behavior rather than testing implementation details that VS Code does not expose.
- Do not commit changes unless the user explicitly asks for a commit.
