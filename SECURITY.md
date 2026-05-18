# Security

This project is intended for local development and learning.

## Secrets

Do not commit API keys, Minecraft authentication tokens, server credentials, or local environment files.

Use `.env` for local secrets and `.env.example` for safe example values.

## Minecraft servers

For early development, use a local Minecraft Java server.

If using `online-mode=false`, do not expose the server to the public internet unless you understand the risks and have added appropriate access controls.

## Bot permissions

Bots should only receive the permissions they need.

Destructive actions such as clearing blocks, filling areas, or running commands should require preview and approval in the local control panel.

## Reporting issues

Please avoid posting secrets, tokens, world backups, or private server addresses in public issues.