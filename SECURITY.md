# Security policy

## Supported versions

Only the latest version on the default branch is currently supported.

## Reporting a vulnerability

Do not open a public issue for a security vulnerability. Contact the repository maintainers through the private security reporting channel configured for the public repository, or the repository owner directly if that channel is not available.

Include the affected version, reproduction steps, impact, and any suggested mitigation. Do not include real credentials, private source code, or personal data in the report.

## Security boundaries

The extension reads workspace content and sends prompts to the local Foundry Local runtime. Edits and allowlisted validation commands require explicit confirmation. Reports involving arbitrary command execution, workspace escape, credential exposure, or unintended remote data transmission should be treated as high priority.