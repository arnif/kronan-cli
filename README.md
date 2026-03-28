# kronan-cli

CLI for [Kronan.is](https://www.kronan.is) -- Iceland's grocery store. Search products, manage your cart, and view order history from the terminal. Built with [Bun](https://bun.sh) and designed to be used by AI agents.

## Quick start

```bash
git clone https://github.com/macarni/kronan-cli.git
cd kronan-cli
bun install
```

## Authentication

Kronan uses **Rafraen skilriki** (Iceland's SIM-based electronic ID) for login. You need an Icelandic phone number with Rafraen skilriki enabled.

```bash
kronan login REDACTED     # Sends auth request to your phone
kronan status            # Check if you're logged in
kronan logout            # Clear tokens
```

Tokens are stored in `~/.kronan/tokens.json` and auto-refresh when expired.

## Usage

```
kronan search <query>         Search for products
kronan product <sku>          Product details by SKU

kronan cart                   View cart
kronan cart add <sku> [qty]   Add item to cart
kronan cart update <id> <qty> Update line quantity
kronan cart remove <id>       Remove line from cart

kronan orders                 Order history
kronan order <id>             Specific order details

kronan me                     User profile
```

All commands support `--json` for structured output.

## AI agent usage

kronan-cli is designed to be called by AI agents as a tool. The `--json` flag on every command returns structured data suitable for parsing.

Example: an agent analyzing purchase history and building a weekly shopping cart:

```bash
# Analyze past orders
kronan orders --json

# Search for a product
kronan search "mjolk" --json --limit 5

# Build a cart from frequent items
kronan cart add 100224198 6    # Nymjolk x6
kronan cart add 02200946 1     # Heimilisbraud
kronan cart add 100253786 4    # Bananar

# Review
kronan cart --json
```

## Project structure

```
src/
  index.ts              CLI entry point and command routing
  auth.ts               AWS Cognito auth (Rafraen skilriki flow)
  api.ts                Kronan backend API client
  commands/
    login.ts            login, logout, status
    search.ts           product search and detail
    orders.ts           order history
    cart.ts             cart management
```

## Requirements

- [Bun](https://bun.sh) runtime
- Icelandic phone number with Rafraen skilriki for authentication

## License

MIT
