#!/usr/bin/env bun

/**
 * kronan-cli - Krónan grocery store CLI
 *
 * AI-agent friendly CLI for searching products, managing cart,
 * and viewing order history on Krónan (https://www.kronan.is).
 *
 * Usage:
 *   kronan token <token>       Save access token (create at https://kronan.is/adgangur/adgangslyklar)
 *   kronan logout              Clear stored token
 *   kronan status              Show login status
 *   kronan search <query>      Search for products
 *   kronan product <sku>       Get product details
 *   kronan orders              View order history
 *   kronan order <token>       View specific order
 *   kronan cart                View cart contents
 *   kronan cart add <sku> [qty]  Add item to cart
 *   kronan cart clear          Clear cart
 *   kronan lists               View product lists
 *
 * Flags:
 *   --json                     Output as JSON (for AI agents)
 *   --page <n>                 Page number for search
 *   --limit <n>                Items per page
 */

import { getMe } from "./api.ts";
import { requireAuth } from "./auth.ts";
import {
  cartAddCommand,
  cartClearCommand,
  cartViewCommand,
  listCommand,
} from "./commands/cart.ts";
import {
  logoutCommand,
  statusCommand,
  tokenCommand,
} from "./commands/login.ts";
import { orderDetailCommand, ordersCommand } from "./commands/orders.ts";
import { productDetailCommand, searchCommand } from "./commands/search.ts";

const args = process.argv.slice(2);
const command = args[0];

// Parse flags
function getFlag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const jsonOutput = hasFlag("json");

async function main() {
  try {
    switch (command) {
      case "token": {
        const tokenValue = args[1];
        if (!tokenValue) {
          console.error("Usage: kronan token <access-token>");
          console.error("");
          console.error(
            "Create an access token at: https://kronan.is/adgangur/adgangslyklar",
          );
          process.exit(1);
        }
        await tokenCommand(tokenValue);
        break;
      }

      case "logout":
        await logoutCommand();
        break;

      case "status":
        await statusCommand();
        break;

      case "search": {
        const query = args[1];
        if (!query) {
          console.error(
            "Usage: kronan search <query> [--page N] [--limit N] [--json]",
          );
          process.exit(1);
        }
        await searchCommand(query, {
          page: getFlag("page") ? parseInt(getFlag("page")!, 10) : undefined,
          json: jsonOutput,
        });
        break;
      }

      case "product": {
        const sku = args[1];
        if (!sku) {
          console.error("Usage: kronan product <sku> [--json]");
          process.exit(1);
        }
        await productDetailCommand(sku, { json: jsonOutput });
        break;
      }

      case "orders":
        await ordersCommand({
          limit: getFlag("limit") ? parseInt(getFlag("limit")!, 10) : undefined,
          offset: getFlag("offset")
            ? parseInt(getFlag("offset")!, 10)
            : undefined,
          json: jsonOutput,
        });
        break;

      case "order": {
        const orderToken = args[1];
        if (!orderToken) {
          console.error("Usage: kronan order <token> [--json]");
          process.exit(1);
        }
        await orderDetailCommand(orderToken, { json: jsonOutput });
        break;
      }

      case "cart": {
        // Filter out flags to get the actual subcommand
        const subcommand = args.find(
          (arg) => !arg.startsWith("-") && args.indexOf(arg) === 1,
        );
        switch (subcommand) {
          case "add": {
            const sku = args[2];
            const qty = args[3] ? parseInt(args[3], 10) : 1;
            if (!sku || sku.startsWith("-")) {
              console.error("Usage: kronan cart add <sku> [quantity] [--json]");
              process.exit(1);
            }
            await cartAddCommand(sku, qty, { json: jsonOutput });
            break;
          }
          case "clear": {
            await cartClearCommand({ json: jsonOutput });
            break;
          }
          case "view":
          case undefined: {
            await cartViewCommand({ json: jsonOutput });
            break;
          }
          default:
            console.error(`Unknown cart subcommand: ${subcommand}`);
            console.error("Usage: kronan cart [view|add|clear]");
            process.exit(1);
        }
        break;
      }

      case "lists":
        await listCommand({ json: jsonOutput });
        break;

      case "me":
      case "profile": {
        const token = await requireAuth();
        const me = await getMe(token);
        if (jsonOutput) {
          console.log(JSON.stringify(me, null, 2));
        } else {
          console.log(`${me.name}`);
          console.log(`  Type: ${me.type}`);
        }
        break;
      }

      case "help":
      case "--help":
      case "-h":
      case undefined:
        printHelp();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error("Run 'kronan help' for usage.");
        process.exit(1);
    }
  } catch (error: any) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: error.message }, null, 2));
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

function printHelp() {
  console.log(`kronan-cli - Krónan grocery store CLI

Commands:
  token <token>          Save access token (create at https://kronan.is/adgangur/adgangslyklar)
  logout                 Clear stored token
  status                 Show login status

  search <query>         Search for products
  product <sku>          Get product details by SKU

  orders                 View order history
  order <token>          View specific order details

  cart add <sku> [qty]   Add item to cart
  cart view              View cart contents (default)
  cart clear             Clear cart
  lists                  View product lists

  me                     Show current identity
  help                   Show this help

Flags:
  --json                 Output structured JSON (for AI agents)
  --page <n>             Page number (search)
  --limit <n>            Results per page
  --offset <n>           Offset for pagination (orders)

Examples:
  kronan token abc123def456
  kronan search "mjólk"
  kronan search "epli" --json --limit 5
  kronan product 02500188
  kronan orders --json
  kronan order abc123...
  kronan cart
  kronan cart add 02500188 2
  kronan cart clear
`);
}

main();
