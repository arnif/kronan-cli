---
name: kronan-cli
description: >
  Search Krónan for groceries and prices, get SKU numbers, add to or change
  shopping cart, and view past order history using the official Krónan Public API.
  Leita að verði á matvörum í Krónunni, vinna með innkaupakörfu (bæta í eða breyta),
  og skoða gamlar pantanir.
version: 0.2.0
requires:
  binaries:
    - gh        # GitHub CLI — required for install
    - bun       # Bun runtime — only needed if building from source
  paths:
    - ~/.kronan/token   # AccessToken for Public API authentication
metadata:
  openclaw:
    homepage: https://github.com/arnif/kronan-cli
    emoji: "\U0001F6D2"
---

# kronan-cli

CLI tool for shopping at [Krónan.is](https://www.kronan.is), Iceland's grocery store chain. Uses the official Krónan Public API. Designed for both humans and AI agents.

## Prerequisites

- [GitHub CLI](https://cli.github.com) (`gh`) — required for the install command
- A Krónan account with **Auðkenni** (Icelandic e-ID) login
- An Access Token from https://kronan.is/adgangur/adgangslyklar

## Install

```bash
gh repo clone arnif/kronan-cli /tmp/kronan-cli && bash /tmp/kronan-cli/install.sh
```

**What this does:** clones the repo to `/tmp/kronan-cli`, then `install.sh` downloads a pre-built binary from the latest GitHub release and places it at `~/.local/bin/kronan` (override with `INSTALL_DIR`).

To build from source instead:

```bash
gh repo clone arnif/kronan-cli && cd kronan-cli
bun install && bun build --compile src/index.ts --outfile kronan
mv kronan ~/.local/bin/
```

## Security and privacy

- **Install script**: `install.sh` executes on your machine and downloads a binary. Audit the [repository](https://github.com/arnif/kronan-cli) and the script before running.
- **Token storage**: Access tokens are stored at `~/.kronan/token`. These are credentials for the Krónan Public API. Ensure the file is only readable by your user (`chmod 600 ~/.kronan/token`).
- **PII**: `kronan me` outputs your identity information (name and type - user or customer group). Be careful when sharing this output.
- **API Access**: Tokens are created in your Krónan account settings and can be revoked at any time at https://kronan.is/adgangur/adgangslyklar

## Authentication

First, create an access token:
1. Go to https://kronan.is/adgangur/adgangslyklar
2. Log in with Auðkenni (Icelandic e-ID)
3. Create a new access token

Then save it with the CLI:

```bash
kronan token <your-access-token>
```

The token will be validated and saved locally.

```bash
kronan logout    # Clear stored token
kronan status    # Check authentication status
```

## Commands

### Search products

```bash
kronan search "mjolk"
kronan search "epli" --limit 5
kronan search "braud" --json
```

### Product details

```bash
kronan product <sku>
kronan product 02500188 --json
```

### Cart management

```bash
kronan cart                         # View cart
kronan cart add <sku> [quantity]    # Add item to cart
kronan cart clear                   # Clear all items from cart
```

### Order history

```bash
kronan orders                # Recent orders
kronan orders --json         # JSON output for parsing
kronan order <token>         # Specific order details (use order token, not ID)
```

### Product lists

```bash
kronan lists                 # View saved product lists
kronan lists --json
```

### User identity

```bash
kronan me              # Show current identity (user or customer group)
kronan me --json
```

## AI Agent Usage

All commands support `--json` for structured output. This makes kronan-cli suitable as a tool for AI agents managing grocery shopping.

**Important:** Commands that change state (`cart add`, `cart clear`) can modify the user's real shopping cart. Agents **must ask for explicit user confirmation** before running any state-changing command.

Read-only commands (`search`, `product`, `orders`, `order`, `cart` (view), `lists`, `me`, `status`) are safe to run without confirmation.

Example agent workflow:

```bash
# 1. Check what the user usually buys
kronan orders --json

# 2. Search for a specific product
kronan search "nymjolk" --json --limit 5

# 3. Add items to cart
kronan cart add 100224198 6
kronan cart add 02200946 1

# 4. Review the cart
kronan cart --json
```

### Typical weekly shopping pattern

An agent can analyze order history to find frequently purchased items and auto-populate the cart:

1. Fetch orders with `kronan orders --json`
2. Count product frequency across orders (by SKU)
3. Add the top items at their typical quantities with `kronan cart add <sku> <qty>`
4. Present the cart for user review with `kronan cart`

## Flags

| Flag | Description |
|------|-------------|
| `--json` | Structured JSON output (for AI agents) |
| `--page <n>` | Page number (search) |
| `--limit <n>` | Results per page |
| `--offset <n>` | Offset for pagination (orders) |

## API Reference

The CLI uses the official Krónan Public API at `https://api.kronan.is/api/v1/`.

API Documentation:
- Swagger UI: https://api.kronan.is/api/v1/schema/swagger-ui/
- ReDoc: https://api.kronan.is/api/v1/schema/redoc/

Key endpoints:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/products/search/` | POST | Yes | Product search |
| `/products/{sku}/` | GET | Yes | Product detail |
| `/checkout/` | GET | Yes | View checkout/cart |
| `/checkout/lines/` | POST | Yes | Add/replace checkout lines |
| `/orders/` | GET | Yes | Order history |
| `/me/` | GET | Yes | Current identity |
| `/product-lists/` | GET | Yes | Product lists |
| `/shopping-notes/` | GET | Yes | Shopping notes |
| `/product-purchase-stats/` | GET | Yes | Purchase statistics |

Auth header format: `Authorization: AccessToken {token}`

## Migration from v0.1.x

If you were using the previous version with Cognito authentication:

1. Remove old tokens: `rm ~/.kronan/tokens.json`
2. Get a new access token from https://kronan.is/adgangur/adgangslyklar
3. Run `kronan token <new-token>`
4. Update any scripts using `kronan login` to use `kronan token` instead

Note: Order IDs in the new API are tokens (UUIDs), not numeric IDs.
