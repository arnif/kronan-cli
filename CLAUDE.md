# kronan-cli

CLI tool for Krónan.is grocery store. Uses Bun runtime.

## Authentication

The Krónan Public API uses AccessToken authentication. You need to create an access token at:
https://kronan.is/adgangur/adgangslyklar

Then save it using the CLI:
```bash
kronan token <your-access-token>
```

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
- `src/auth.ts` — AccessToken storage and management
- `src/api.ts` — Krónan Public API client (`https://api.kronan.is/api/v1`)
- `src/commands/` — Individual command implementations

## Key conventions

- Use Bun APIs: `Bun.file`, `Bun.write`, `bun:test`
- All commands must support `--json` flag for structured AI-agent output
- Auth tokens stored in `~/.kronan/token`
- API auth header format: `Authorization: AccessToken {token}`

## API endpoints

### Me
- `GET /api/v1/me/` — Current identity (user or customer group)

### Products
- `POST /api/v1/products/search/` — Search products
- `GET /api/v1/products/{sku}/` — Get product details

### Categories
- `GET /api/v1/categories/` — List category tree
- `GET /api/v1/categories/{slug}/products/` — Get category products

### Orders
- `GET /api/v1/orders/` — List orders
- `GET /api/v1/orders/{token}/` — Get order details
- `POST /api/v1/orders/{token}/delete-lines/` — Delete order lines
- `POST /api/v1/orders/{token}/lower-quantity-lines/` — Lower line quantities
- `POST /api/v1/orders/{token}/lines-toggle-substitution/` — Toggle substitution

### Checkout
- `GET /api/v1/checkout/` — Get active checkout
- `POST /api/v1/checkout/lines/` — Add or replace checkout lines

### Product Lists
- `GET /api/v1/product-lists/` — List product lists
- `POST /api/v1/product-lists/` — Create product list
- `GET /api/v1/product-lists/{token}/` — Get product list details
- `PATCH /api/v1/product-lists/{token}/` — Update product list
- `DELETE /api/v1/product-lists/{token}/` — Delete product list
- `POST /api/v1/product-lists/{token}/update-item/` — Add/update item

### Shopping Notes
- `GET /api/v1/shopping-notes/` — Get shopping note
- `POST /api/v1/shopping-notes/add-line/` — Add note line
- `PATCH /api/v1/shopping-notes/change-line/` — Update note line
- `DELETE /api/v1/shopping-notes/delete-line/` — Delete note line

### Purchase Stats
- `GET /api/v1/product-purchase-stats/` — List purchase history
