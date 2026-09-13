# Security policy

## Supported versions

Only the latest version on the default branch is currently supported.

## Reporting a vulnerability

Do not open a public issue for a security vulnerability. Use the repository's [private vulnerability reporting page](https://github.com/tausagiz/foundry-vscode-plugin/security/advisories/new). If that page is unavailable, contact the repository owner through GitHub rather than disclosing the issue publicly.

Include the affected version, reproduction steps, impact, and any suggested mitigation. Do not include real credentials, private source code, or personal data in the report.

## Security boundaries

The extension reads workspace content and sends prompts to the local Foundry Local runtime. Edits and allowlisted validation commands require explicit confirmation. Reports involving arbitrary command execution, workspace escape, credential exposure, or unintended remote data transmission should be treated as high priority.