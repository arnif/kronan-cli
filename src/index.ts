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
 *   kronan groups                List customer groups
 *   kronan group <id>            Set active group
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
 *   --group <id>                 Customer group ID (orders)
 */

import { getCustomerGroups, getUserProfile } from "./api.ts";
import {
  getActiveGroupId,
  loadConfig,
  requireAuth,
  saveConfig,
} from "./auth.ts";
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
const groupFlag = getFlag("group")
  ? parseInt(getFlag("group")!, 10)
  : undefined;

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
          group: groupFlag,
        });
        break;

      case "order": {
        const orderId = args[1];
        if (!orderId) {
          console.error("Usage: kronan order <id> [--json] [--group ID]");
          process.exit(1);
        }
        await orderDetailCommand(orderId, { json: jsonOutput, group: groupFlag });
        break;
      }

      case "groups": {
        const tokens = await requireAuth();
        const groups = await getCustomerGroups(tokens);
        const config = await loadConfig();

        if (jsonOutput) {
          console.log(
            JSON.stringify({ groups, activeGroupId: config.customerGroupId }, null, 2),
          );
        } else {
          if (groups.length === 0) {
            console.log("No customer groups found.");
          } else {
            console.log("Customer groups:\n");
            for (const group of groups) {
              const active = config.customerGroupId === group.id ? " (active)" : "";
              console.log(`  ${group.id}  ${group.name}${active}`);
              if (group.members?.length) {
                for (const member of group.members) {
                  const admin = member.isAdmin ? " [admin]" : "";
                  console.log(`    - ${member.name}${admin}`);
                }
              }
            }
            console.log(
              "\nUse 'kronan group <id>' to set active group for orders.",
            );
          }
        }
        break;
      }

      case "group": {
        const groupId = args[1];
        if (!groupId) {
          // Show current group
          const config = await loadConfig();
          if (config.customerGroupId) {
            const tokens = await requireAuth();
            const groups = await getCustomerGroups(tokens);
            const match = groups.find((g) => g.id === config.customerGroupId);
            const name = match ? ` (${match.name})` : "";
            console.log(`Active group: ${config.customerGroupId}${name}`);
          } else {
            console.log("No active group set. Use 'kronan group <id>' to set one.");
          }
        } else if (groupId === "clear" || groupId === "none") {
          const config = await loadConfig();
          delete config.customerGroupId;
          await saveConfig(config);
          console.log("Cleared active group. Orders will now use personal account.");
        } else {
          const id = parseInt(groupId, 10);
          if (Number.isNaN(id)) {
            console.error("Invalid group ID. Use 'kronan groups' to see available groups.");
            process.exit(1);
          }
          // Validate group exists
          const tokens = await requireAuth();
          const groups = await getCustomerGroups(tokens);
          const match = groups.find((g) => g.id === id);
          if (!match) {
            console.error(`Group ${id} not found. Available groups:`);
            for (const g of groups) {
              console.error(`  ${g.id}  ${g.name}`);
            }
            process.exit(1);
          }
          const config = await loadConfig();
          config.customerGroupId = id;
          await saveConfig(config);
          console.log(`Active group set to ${id} (${match.name}).`);
        }
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
            await cartAddCommand(sku, qty, { json: jsonOutput, group: groupFlag });
            break;
          }
          case "view":
          case undefined: {
            await cartViewCommand({ json: jsonOutput, group: groupFlag });
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
            await cartUpdateCommand(lineId, qty, { json: jsonOutput, group: groupFlag });
            break;
          }
          case "remove": {
            const lineId = args[2] ? parseInt(args[2], 10) : NaN;
            if (Number.isNaN(lineId)) {
              console.error("Usage: kronan cart remove <lineId> [--json]");
              process.exit(1);
            }
            await cartRemoveCommand(lineId, { json: jsonOutput, group: groupFlag });
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

  groups                 List customer groups (shared accounts)
  group <id>             Set active group for orders
  group clear            Clear active group (use personal account)

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
  --group <id>           Use specific customer group (orders)

Examples:
  kronan login <phone-number>
  kronan search "mjólk"
  kronan search "epli" --json --limit 5
  kronan product 02500188
  kronan orders --json
  kronan order 727555
  kronan groups
  kronan group 7921
  kronan orders --group 7921
  kronan cart
  kronan cart add 02500188 2
  kronan cart remove 12345
`);
}

main();
