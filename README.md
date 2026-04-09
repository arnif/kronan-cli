# kronan-cli

CLI for [Krónan.is](https://www.kronan.is) -- Iceland's grocery store. Search products, manage your cart, and view order history from the terminal. Built with [Bun](https://bun.sh) and designed to be used by AI agents.

Uses the new Krónan Public API (https://api.kronan.is/api/v1/).

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

Krónan's Public API uses **AccessToken** authentication. You need to create an access token from your Krónan account settings.

1. Go to https://kronan.is/adgangur/adgangslyklar
2. Create a new access token
3. Save it with the CLI:

```bash
kronan token <your-access-token>
kronan status            # Check if token is valid
kronan logout            # Clear token
```

Tokens are stored in `~/.kronan/token`.

**Note:** You must have a Krónan account with Auðkenni (Icelandic e-ID) login to create access tokens.

## Usage

```
kronan token <token>          Save access token
kronan status                 Check authentication status
kronan logout                 Clear stored token

kronan search <query>         Search for products
kronan product <sku>          Product details by SKU

kronan cart                   View cart
kronan cart add <sku> [qty]   Add item to cart
kronan cart clear             Clear cart

kronan orders                 Order history
kronan order <token>          Specific order details

kronan lists                  View product lists
kronan me                     Show current identity
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
  auth.ts               AccessToken storage and management
  api.ts                Krónan Public API client
  commands/
    login.ts            token, logout, status
    search.ts           product search and detail
    orders.ts           order history
    cart.ts             cart management
```

## API Documentation

The Krónan Public API is documented at:
- Swagger UI: https://api.kronan.is/api/v1/schema/swagger-ui/
- ReDoc: https://api.kronan.is/api/v1/schema/redoc/

## Privacy

`kronan me` outputs your identity information. Be careful when sharing this output — avoid pasting it in public channels, issue trackers, or LLM conversations that may be logged.

## Requirements

- Krónan account with Auðkenni (Icelandic e-ID) login
- Access token from https://kronan.is/adgangur/adgangslyklar
- [GitHub CLI](https://cli.github.com) for installation (or [Bun](https://bun.sh) if running from source)

## License

MIT
