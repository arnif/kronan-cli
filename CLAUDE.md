# kronan-cli

CLI tool for Kronan.is grocery store. Uses Bun runtime.

## Development

- `bun install` to install dependencies
- `bun run src/index.ts <command>` to run commands
- `bun test` to run tests
- `bun run lint` to check lint and formatting (Biome)
- `bun run lint:fix` to auto-fix lint and formatting issues
- `bun run typecheck` to run TypeScript type checking
- `bun run check` to run all checks (lint + typecheck + test)

## Architecture

- `src/index.ts` — CLI entry point, command routing, flag parsing
- `src/auth.ts` — AWS Cognito custom auth with Rafraen skilriki (Icelandic e-ID)
- `src/api.ts` — Kronan backend API client (`https://backend.kronan.is/api/`)
- `src/commands/` — Individual command implementations

## Key conventions

- Use Bun APIs: `Bun.file`, `Bun.write`, `bun:test`
- All commands must support `--json` flag for structured AI-agent output
- Auth tokens stored in `~/.kronan/tokens.json`
- Cart endpoints require `Customer-Group-Id` header (fetched dynamically)
- API auth header format: `Authorization: CognitoJWT {idToken}`

## API endpoints

- Product search: `POST /api/products/raw-search/?with_detail=true`
- Cart view: `GET /api/smart-checkouts/default/`
- Cart add: `POST /api/smart-checkouts/default/lines/`
- Cart update: `PATCH /api/smart-checkouts/default/lines/{id}/`
- Cart remove: `DELETE /api/smart-checkouts/default/lines/{id}/`
- Orders: `GET /api/orders/`
- User profile: `GET /api/users/me/`
- Customer groups: `GET /api/customer_groups/`
