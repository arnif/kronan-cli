#!/usr/bin/env bun

/**
 * kronan-cli - Krónan grocery store CLI
 *
 * AI-agent friendly CLI for searching products, managing cart,
 * and viewing order history on Krónan (https://www.kronan.is).
 *
 * Usage:
 *   kronan login <phone>        Login via Rafræn skilríki
 *   kronan logout                Clear stored tokens
 *   kronan status                Show login status
 *   kronan search <query>        Search for products
 *   kronan product <sku>         Get product details
 *   kronan orders                View order history
 *   kronan order <id>            View specific order
 *   kronan cart                 View cart contents
 *   kronan cart add <sku> [qty]  Add item to cart
 *   kronan cart update <id> <q>  Update cart line quantity
 *   kronan cart remove <id>      Remove cart line
 *   kronan lists                 View shopping lists
 *
 * Flags:
 *   --json                       Output as JSON (for AI agents)
 *   --page <n>                   Page number for search
 *   --limit <n>                  Items per page
 *   --store <extId>              Store ID for search
 */

import { getUserProfile } from "./api.ts";
import { requireAuth } from "./auth.ts";
import {
  cartAddCommand,
  cartRemoveCommand,
  cartUpdateCommand,
  cartViewCommand,
  listCommand,
} from "./commands/cart.ts";
import {
  loginCommand,
  logoutCommand,
  statusCommand,
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
      case "login": {
        const phone = args[1];
        if (!phone) {
          console.error("Usage: kronan login <phone-number>");
          process.exit(1);
        }
        await loginCommand(phone);
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
            "Usage: kronan search <query> [--page N] [--limit N] [--store ID] [--json]",
          );
          process.exit(1);
        }
        await searchCommand(query, {
          page: getFlag("page") ? parseInt(getFlag("page")!, 10) : undefined,
          pageSize: getFlag("limit")
            ? parseInt(getFlag("limit")!, 10)
            : undefined,
          store: getFlag("store"),
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
        const orderId = args[1];
        if (!orderId) {
          console.error("Usage: kronan order <id> [--json]");
          process.exit(1);
        }
        await orderDetailCommand(orderId, { json: jsonOutput });
        break;
      }

      case "cart": {
        const subcommand = args[1];
        switch (subcommand) {
          case "add": {
            const sku = args[2];
            const qty = args[3] ? parseInt(args[3], 10) : 1;
            if (!sku) {
              console.error("Usage: kronan cart add <sku> [quantity] [--json]");
              process.exit(1);
            }
            await cartAddCommand(sku, qty, { json: jsonOutput });
            break;
          }
          case "view":
          case undefined: {
            await cartViewCommand({ json: jsonOutput });
            break;
          }
          case "update": {
            const lineId = args[2] ? parseInt(args[2], 10) : NaN;
            const qty = args[3] ? parseInt(args[3], 10) : NaN;
            if (Number.isNaN(lineId) || Number.isNaN(qty)) {
              console.error(
                "Usage: kronan cart update <lineId> <quantity> [--json]",
              );
              process.exit(1);
            }
            await cartUpdateCommand(lineId, qty, { json: jsonOutput });
            break;
          }
          case "remove": {
            const lineId = args[2] ? parseInt(args[2], 10) : NaN;
            if (Number.isNaN(lineId)) {
              console.error("Usage: kronan cart remove <lineId> [--json]");
              process.exit(1);
            }
            await cartRemoveCommand(lineId, { json: jsonOutput });
            break;
          }
          default:
            console.error(`Unknown cart subcommand: ${subcommand}`);
            console.error("Usage: kronan cart [view|add|update|remove]");
            process.exit(1);
        }
        break;
      }

      case "lists":
        await listCommand({ json: jsonOutput });
        break;

      case "me":
      case "profile": {
        const tokens = await requireAuth();
        const profile = await getUserProfile(tokens);
        if (jsonOutput) {
          console.log(JSON.stringify(profile, null, 2));
        } else {
          console.log(`${profile.name}`);
          console.log(`  Email: ${profile.email}`);
          console.log(`  Phone: ${profile.phoneNumber}`);
          console.log(`  SSN:   ${profile.ssn}`);
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
  login <phone>          Login via Rafræn skilríki (Icelandic e-ID)
  logout                 Clear stored tokens
  status                 Show login status

  search <query>         Search for products
  product <sku>          Get product details by SKU

  orders                 View order history
  order <id>             View specific order details

  cart add <sku> [qty]   Add item to cart
  cart view              View cart contents (default)
  cart update <id> <qty> Update cart line quantity
  cart remove <id>       Remove line from cart
  lists                  View shopping lists

  me                     Show user profile
  help                   Show this help

Flags:
  --json                 Output structured JSON (for AI agents)
  --page <n>             Page number (search)
  --limit <n>            Results per page
  --offset <n>           Offset for pagination (orders)
  --store <extId>        Store external ID (search)

Examples:
  kronan login <phone-number>
  kronan search "mjólk"
  kronan search "epli" --json --limit 5
  kronan product 02500188
  kronan orders --json
  kronan order 727555
  kronan cart
  kronan cart add 02500188 2
  kronan cart remove 12345
`);
}

main();
