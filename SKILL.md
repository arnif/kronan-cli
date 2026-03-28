---
name: kronan-cli
description: CLI tool for Kronan.is, Iceland's grocery store. Search products, manage cart, view orders. Built for AI agents.
version: 0.1.0
metadata:
  openclaw:
    homepage: https://github.com/arnif/kronan-cli
    emoji: "\U0001F6D2"
---

# kronan-cli

CLI tool for shopping at [Kronan.is](https://www.kronan.is), Iceland's grocery store chain. Designed for both humans and AI agents.

## Install

Requires [GitHub CLI](https://cli.github.com):

```bash
gh repo clone arnif/kronan-cli /tmp/kronan-cli && bash /tmp/kronan-cli/install.sh
```

This installs a standalone binary to `~/.local/bin/kronan`. No runtime dependencies needed.

## Authentication

Kronan uses Rafraen skilriki (Iceland's SIM-based electronic ID) for authentication. You must have an Icelandic phone number with Rafraen skilriki enabled.

```bash
kronan login <phone-number>
```

You will be prompted to confirm on your phone. Tokens are stored locally in `~/.kronan/tokens.json` and refresh automatically.

```bash
kronan logout    # Clear stored tokens
kronan status    # Check login status
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
kronan cart add <sku> [quantity]    # Add item
kronan cart update <lineId> <qty>  # Update quantity
kronan cart remove <lineId>        # Remove item
```

### Order history

```bash
kronan orders                # Recent orders
kronan orders --json         # JSON output for parsing
kronan order <id>            # Specific order details
```

### User profile

```bash
kronan me
```

## AI Agent Usage

All commands support `--json` for structured output. This makes kronan-cli suitable as a tool for AI agents managing grocery shopping.

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
| `--store <extId>` | Store external ID (search, default: 159) |

## API Reference

The CLI wraps the Kronan backend API at `https://backend.kronan.is/api/`. Key endpoints:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/products/raw-search/` | POST | No | Product search |
| `/products/{sku}/` | GET | No | Product detail |
| `/smart-checkouts/default/` | GET | Yes | View cart |
| `/smart-checkouts/default/lines/` | POST | Yes | Add to cart |
| `/smart-checkouts/default/lines/{id}/` | PATCH | Yes | Update cart line |
| `/smart-checkouts/default/lines/{id}/` | DELETE | Yes | Remove from cart |
| `/orders/` | GET | Yes | Order history |
| `/users/me/` | GET | Yes | User profile |
| `/customer_groups/` | GET | Yes | Customer groups |

Auth header format: `Authorization: CognitoJWT {idToken}`

Cart endpoints also require: `Customer-Group-Id: {groupId}`
