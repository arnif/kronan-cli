#!/usr/bin/env bun

/**
 * kronan-cli - Krónan grocery store CLI
 *
 * AI-agent friendly CLI for searching products, managing cart,
 * and viewing order history on Krónan (https://www.kronan.is).
 *
 * Usage:
 *   kronan token <token>       Save access token (create at https://kronan.is/adgangur/adgangslyklar)
 *   kronan profiles            List saved profiles
 *   kronan profile <name>      Switch active profile
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
} from "./commands/cart.ts";
import {
  categoriesCommand,
  categoryProductsCommand,
} from "./commands/categories.ts";
import {
  logoutCommand,
  profileRemoveCommand,
  profileSwitchCommand,
  profilesCommand,
  statusCommand,
  tokenCommand,
} from "./commands/login.ts";
import { orderDetailCommand, ordersCommand } from "./commands/orders.ts";
import {
  orderDeleteLinesCommand,
  orderLowerQuantityCommand,
  orderToggleSubstitutionCommand,
} from "./commands/orders-modify.ts";
import {
  listAddItemCommand,
  listClearCommand,
  listCreateCommand,
  listDeleteCommand,
  listDetailCommand,
  listRemoveItemCommand,
  listsCommand,
} from "./commands/product-lists.ts";
import {
  statsCommand,
  statsIgnoreCommand,
  statsUnignoreCommand,
} from "./commands/purchase-stats.ts";
import { productDetailCommand, searchCommand } from "./commands/search.ts";
import {
  notesAddCommand,
  notesArchivedCommand,
  notesClearCommand,
  notesCommand,
  notesRemoveCommand,
  notesToggleCommand,
  notesUpdateCommand,
} from "./commands/shopping-notes.ts";

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
          console.error("Usage: kronan token <access-token> [--name <profile-name>]");
          console.error("");
          console.error(
            "Create an access token at: https://kronan.is/adgangur/adgangslyklar",
          );
          process.exit(1);
        }
        await tokenCommand(tokenValue, { name: getFlag("name") });
        break;
      }

      case "logout":
        await logoutCommand();
        break;

      case "status":
        await statusCommand();
        break;

      case "profiles":
        await profilesCommand();
        break;

      case "profile": {
        const subcommand = args[1];
        if (!subcommand) {
          await profilesCommand();
        } else if (subcommand === "remove") {
          const name = args[2];
          if (!name) {
            console.error("Usage: kronan profile remove <name>");
            process.exit(1);
          }
          await profileRemoveCommand(name);
        } else {
          await profileSwitchCommand(subcommand);
        }
        break;
      }

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

      case "categories": {
        await categoriesCommand({ json: jsonOutput });
        break;
      }

      case "category": {
        const slug = args[1];
        if (!slug) {
          console.error("Usage: kronan category <slug> [--page N] [--json]");
          process.exit(1);
        }
        await categoryProductsCommand(slug, {
          page: getFlag("page") ? parseInt(getFlag("page")!, 10) : undefined,
          json: jsonOutput,
        });
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
        // Check if args[1] is a subcommand for order modifications
        const subcommand = args[1];
        if (
          subcommand === "delete-lines" ||
          subcommand === "lower-quantity" ||
          subcommand === "toggle-substitution"
        ) {
          // Order modification subcommands
          switch (subcommand) {
            case "delete-lines": {
              const orderToken = args[2];
              if (!orderToken) {
                console.error(
                  "Usage: kronan order delete-lines <token> <lineIds...> [--json]",
                );
                process.exit(1);
              }
              const lineIds = args
                .slice(3)
                .filter((arg) => !arg.startsWith("-"))
                .map((id) => parseInt(id, 10));
              if (lineIds.length === 0) {
                console.error(
                  "Usage: kronan order delete-lines <token> <lineIds...> [--json]",
                );
                process.exit(1);
              }
              await orderDeleteLinesCommand(orderToken, lineIds, {
                json: jsonOutput,
              });
              break;
            }
            case "lower-quantity": {
              const orderToken = args[2];
              if (!orderToken) {
                console.error(
                  "Usage: kronan order lower-quantity <token> <lineIds...> --quantity N [--json]",
                );
                process.exit(1);
              }
              const lineIds = args
                .slice(3)
                .filter((arg) => !arg.startsWith("-"))
                .map((id) => parseInt(id, 10));
              if (lineIds.length === 0) {
                console.error(
                  "Usage: kronan order lower-quantity <token> <lineIds...> --quantity N [--json]",
                );
                process.exit(1);
              }
              const quantity = getFlag("quantity")
                ? parseInt(getFlag("quantity")!, 10)
                : 1;
              await orderLowerQuantityCommand(orderToken, lineIds, quantity, {
                json: jsonOutput,
              });
              break;
            }
            case "toggle-substitution": {
              const orderToken = args[2];
              if (!orderToken) {
                console.error(
                  "Usage: kronan order toggle-substitution <token> <lineIds...> [--json]",
                );
                process.exit(1);
              }
              const lineIds = args
                .slice(3)
                .filter((arg) => !arg.startsWith("-"))
                .map((id) => parseInt(id, 10));
              if (lineIds.length === 0) {
                console.error(
                  "Usage: kronan order toggle-substitution <token> <lineIds...> [--json]",
                );
                process.exit(1);
              }
              await orderToggleSubstitutionCommand(orderToken, lineIds, {
                json: jsonOutput,
              });
              break;
            }
          }
        } else {
          // View order details
          const orderToken = args[1];
          if (!orderToken) {
            console.error("Usage: kronan order <token> [--json]");
            console.error(
              "       kronan order delete-lines <token> <lineIds...> [--json]",
            );
            console.error(
              "       kronan order lower-quantity <token> <lineIds...> --quantity N [--json]",
            );
            console.error(
              "       kronan order toggle-substitution <token> <lineIds...> [--json]",
            );
            process.exit(1);
          }
          await orderDetailCommand(orderToken, { json: jsonOutput });
        }
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

      case "lists": {
        // Get subcommand (arg at index 1 that doesn't start with -)
        const subcommand = args.find(
          (arg) => !arg.startsWith("-") && args.indexOf(arg) === 1,
        );
        switch (subcommand) {
          case "create": {
            const name = args[2];
            if (!name || name.startsWith("-")) {
              console.error(
                "Usage: kronan lists create <name> [--description <desc>] [--json]",
              );
              process.exit(1);
            }
            await listCreateCommand(name, {
              description: getFlag("description"),
              json: jsonOutput,
            });
            break;
          }
          case "view": {
            const token = args[2];
            if (!token || token.startsWith("-")) {
              console.error("Usage: kronan lists view <token> [--json]");
              process.exit(1);
            }
            await listDetailCommand(token, { json: jsonOutput });
            break;
          }
          case "delete": {
            const token = args[2];
            if (!token || token.startsWith("-")) {
              console.error(
                "Usage: kronan lists delete <token> [--force] [--json]",
              );
              process.exit(1);
            }
            await listDeleteCommand(token, {
              force: hasFlag("force"),
            });
            break;
          }
          case "add": {
            const listToken = args[2];
            const sku = args[3];
            const qty = args[4] ? parseInt(args[4], 10) : 1;
            if (
              !listToken ||
              listToken.startsWith("-") ||
              !sku ||
              sku.startsWith("-")
            ) {
              console.error(
                "Usage: kronan lists add <list-token> <sku> [quantity] [--json]",
              );
              process.exit(1);
            }
            await listAddItemCommand(listToken, sku, qty, { json: jsonOutput });
            break;
          }
          case "remove": {
            const listToken = args[2];
            const sku = args[3];
            if (
              !listToken ||
              listToken.startsWith("-") ||
              !sku ||
              sku.startsWith("-")
            ) {
              console.error(
                "Usage: kronan lists remove <list-token> <sku> [--json]",
              );
              process.exit(1);
            }
            await listRemoveItemCommand(listToken, sku, { json: jsonOutput });
            break;
          }
          case "clear": {
            const token = args[2];
            if (!token || token.startsWith("-")) {
              console.error(
                "Usage: kronan lists clear <token> [--force] [--json]",
              );
              process.exit(1);
            }
            await listClearCommand(token, {
              force: hasFlag("force"),
            });
            break;
          }
          default: {
            // Default: list all lists
            if (subcommand && subcommand !== "view") {
              console.error(`Unknown lists subcommand: ${subcommand}`);
              console.error(
                "Usage: kronan lists [create|view|delete|add|remove|clear]",
              );
              process.exit(1);
            }
            await listsCommand({ json: jsonOutput });
            break;
          }
        }
        break;
      }

      case "notes": {
        // Get subcommand (arg at index 1 that doesn't start with -)
        const subcommand = args.find(
          (arg) => !arg.startsWith("-") && args.indexOf(arg) === 1,
        );
        switch (subcommand) {
          case "add": {
            const text = getFlag("text");
            const sku = getFlag("sku");
            const quantity = getFlag("quantity")
              ? parseInt(getFlag("quantity")!, 10)
              : undefined;
            await notesAddCommand({ text, sku, quantity, json: jsonOutput });
            break;
          }
          case "update": {
            const lineToken = args[2];
            if (!lineToken || lineToken.startsWith("-")) {
              console.error(
                "Usage: kronan notes update <line-token> [--text <text>] [--quantity <n>] [--json]",
              );
              process.exit(1);
            }
            const updates: { text?: string; quantity?: number } = {};
            if (getFlag("text")) updates.text = getFlag("text");
            if (getFlag("quantity"))
              updates.quantity = parseInt(getFlag("quantity")!, 10);
            await notesUpdateCommand(lineToken, updates, { json: jsonOutput });
            break;
          }
          case "remove": {
            const lineToken = args[2];
            if (!lineToken || lineToken.startsWith("-")) {
              console.error("Usage: kronan notes remove <line-token> [--json]");
              process.exit(1);
            }
            await notesRemoveCommand(lineToken, { json: jsonOutput });
            break;
          }
          case "toggle": {
            const lineToken = args[2];
            if (!lineToken || lineToken.startsWith("-")) {
              console.error("Usage: kronan notes toggle <line-token> [--json]");
              process.exit(1);
            }
            await notesToggleCommand(lineToken, { json: jsonOutput });
            break;
          }
          case "clear": {
            await notesClearCommand({ force: hasFlag("force") });
            break;
          }
          case "archived": {
            await notesArchivedCommand({ json: jsonOutput });
            break;
          }
          default: {
            // Default: show notes
            if (subcommand) {
              console.error(`Unknown notes subcommand: ${subcommand}`);
              console.error(
                "Usage: kronan notes [add|update|remove|toggle|clear|archived]",
              );
              process.exit(1);
            }
            await notesCommand({ json: jsonOutput });
            break;
          }
        }
        break;
      }

      case "stats": {
        // Check if args[1] is a subcommand (not a flag)
        const subcommand = args[1];
        if (subcommand === "ignore" || subcommand === "unignore") {
          const id = args[2];
          if (!id || id.startsWith("-")) {
            console.error(`Usage: kronan stats ${subcommand} <id> [--json]`);
            process.exit(1);
          }
          const idNum = parseInt(id, 10);
          if (subcommand === "ignore") {
            await statsIgnoreCommand(idNum, { json: jsonOutput });
          } else {
            await statsUnignoreCommand(idNum, { json: jsonOutput });
          }
        } else {
          // stats command with optional flags
          await statsCommand({
            limit: getFlag("limit")
              ? parseInt(getFlag("limit")!, 10)
              : undefined,
            offset: getFlag("offset")
              ? parseInt(getFlag("offset")!, 10)
              : undefined,
            includeIgnored: hasFlag("include-ignored"),
            json: jsonOutput,
          });
        }
        break;
      }

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

Authentication:
  token <token>                   Save access token (create at https://kronan.is/adgangur/adgangslyklar)
  token <token> --name <name>     Save token as a named profile
  logout                          Clear stored token
  status                          Show login status

Profiles:
  profiles                        List saved profiles
  profile <name>                  Switch active profile
  profile remove <name>           Remove a profile

Products & Search:
  search <query>                  Search for products
  product <sku>                   Get product details by SKU
  categories                      List all categories
  category <slug>                 List products in a category

Orders:
  orders                          View order history
  order <token>                   View specific order details
  order delete-lines <token> <lineIds...>
                                  Delete lines from an order
  order lower-quantity <token> <lineIds...> --quantity N
                                  Lower quantity of order lines
  order toggle-substitution <token> <lineIds...>
                                  Toggle substitution for order lines

Cart:
  cart                            View cart contents (default)
  cart add <sku> [qty]            Add item to cart
  cart clear                      Clear cart

Product Lists:
  lists                           View all product lists
  lists create <name>             Create a new list (--description)
  lists view <token>              View list details
  lists delete <token>            Delete a list (--force)
  lists add <list-token> <sku> [qty]
                                  Add item to list
  lists remove <list-token> <sku> Remove item from list
  lists clear <token>             Clear all items from list (--force)

Shopping Notes:
  notes                           View shopping notes
  notes add                       Add a note (--text, --sku, --quantity)
  notes update <line-token>       Update a note line (--text, --quantity)
  notes remove <line-token>       Remove a note line
  notes toggle <line-token>       Toggle note line status
  notes clear                     Clear all notes (--force)
  notes archived                  View archived notes

Purchase Stats:
  stats                           View purchase history (--limit, --offset, --include-ignored)
  stats ignore <id>               Ignore a purchase stat entry
  stats unignore <id>             Unignore a purchase stat entry

User:
  me                              Show current identity
  help                            Show this help

Flags:
  --json                          Output structured JSON (for AI agents)
  --page <n>                      Page number (search, category)
  --limit <n>                     Results per page
  --offset <n>                    Offset for pagination
  --quantity <n>                  Quantity for add/lower-quantity commands
  --description <text>            Description for lists create
  --text <text>                   Text for notes
  --sku <sku>                     SKU for notes
  --name <name>                   Profile name for token command
  --force                         Force destructive operations
  --include-ignored               Include ignored items in stats

Examples:
  kronan token abc123 --name personal
  kronan token def456 --name family
  kronan profiles
  kronan profile family
  kronan search "mjólk"
  kronan search "epli" --json --limit 5
  kronan product 02500188
  kronan categories
  kronan category mjolkursvorur
  kronan orders --json
  kronan order abc123...
  kronan order delete-lines abc123 line1 line2
  kronan cart
  kronan cart add 02500188 2
  kronan lists create "Weekly Shopping" --description "Groceries for the week"
  kronan lists add mylist-token 02500188 3
  kronan notes add --text "Buy milk" --sku 02500188 --quantity 2
  kronan stats --limit 10
`);
}

main();
