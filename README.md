# kronan-cli

CLI for [Kronan.is](https://www.kronan.is) -- Iceland's grocery store. Search products, manage your cart, and view order history from the terminal. Built with [Bun](https://bun.sh) and designed to be used by AI agents.

## Install

### One-liner (requires [GitHub CLI](https://cli.github.com))

```bash
gh repo clone arnif/kronan-cli /tmp/kronan-cli && bash /tmp/kronan-cli/install.sh
```

This downloads the latest pre-built binary for your platform and installs it to `~/.local/bin/kronan`.

### Custom install directory

```bash
INSTALL_DIR=/usr/local/bin bash install.sh
```

### From source (development)

```bash
git clone https://github.com/arnif/kronan-cli.git
cd kronan-cli
bun install
bun run src/index.ts help
```

## Authentication

Kronan uses **Rafraen skilriki** (Iceland's SIM-based electronic ID) for login. You need an Icelandic phone number with Rafraen skilriki enabled.

```bash
kronan login XXXXXX     # Sends auth request to your phone
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

kronan groups                 List customer groups (shared accounts)
kronan group <id>             Set active group
kronan group clear            Switch back to personal account

kronan me                     User profile (⚠️  outputs PII, see below)
```

All commands support `--json` for structured output.

### Customer groups

If your Krónan account belongs to a shared customer group (e.g., a family account), you can switch to it to access shared orders and cart:

```bash
kronan groups                 # List available groups
kronan group 7921             # Set active group (persisted)
kronan orders                 # Now shows group orders
kronan group clear            # Back to personal account
```

You can also override per-command with `--group <id>`:

```bash
kronan orders --group 7921
kronan cart view --group 7921
```

Group config is stored in `~/.kronan/config.json`.

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

## Privacy

`kronan me` outputs your full user profile including **personally identifiable information (PII)** such as your name, phone number, and Icelandic national ID number (kennitala/SSN). Be careful when sharing this output — avoid pasting it in public channels, issue trackers, or LLM conversations that may be logged.

## Requirements

- Icelandic phone number with Rafraen skilriki for authentication
- [GitHub CLI](https://cli.github.com) for installation (or [Bun](https://bun.sh) if running from source)

## License

MIT
