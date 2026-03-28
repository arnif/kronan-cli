/**
 * Cart commands — uses the smart-checkouts API
 */

import {
  addToCart,
  type CartLine,
  getCart,
  getCustomerGroupId,
  getShoppingLists,
  removeCartLine,
  updateCartLine,
} from "../api.ts";
import { requireAuth } from "../auth.ts";

/**
 * View current cart contents.
 */
export async function cartViewCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const tokens = await requireAuth();
  const groupId = await getCustomerGroupId(tokens);
  const cart = await getCart(tokens, groupId);

  if (options.json) {
    console.log(JSON.stringify(cart, null, 2));
    return;
  }

  const lines: CartLine[] = cart.lines || [];
  if (lines.length === 0) {
    console.log("Cart is empty.");
    return;
  }

  console.log(`Cart (${lines.length} items):\n`);
  let total = 0;
  for (const line of lines) {
    const name = line.product?.name || "Unknown";
    const sku = line.product?.sku || "?";
    const price = (line as any).price || line.product?.price || 0;
    const lineTotal = (line as any).total || price * line.quantity;
    total += lineTotal;
    console.log(
      `  [${line.id}] ${name}  x${line.quantity}  ${price} kr  = ${lineTotal} kr  (SKU: ${sku})`,
    );
  }
  console.log(`\n  Total: ${total} kr`);
}

/**
 * Add item(s) to cart.
 */
export async function cartAddCommand(
  sku: string,
  quantity: number = 1,
  options: { json?: boolean } = {},
): Promise<void> {
  const tokens = await requireAuth();
  const groupId = await getCustomerGroupId(tokens);

  const result = await addToCart(tokens, groupId, [
    { sku, quantity, source: "search" },
  ]);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Added ${quantity}x ${sku} to cart.`);
  }
}

/**
 * Update quantity of a cart line.
 */
export async function cartUpdateCommand(
  lineId: number,
  quantity: number,
  options: { json?: boolean } = {},
): Promise<void> {
  const tokens = await requireAuth();
  const groupId = await getCustomerGroupId(tokens);

  const result = await updateCartLine(tokens, groupId, lineId, quantity);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Updated line ${lineId} to quantity ${quantity}.`);
  }
}

/**
 * Remove a line from the cart.
 */
export async function cartRemoveCommand(
  lineId: number,
  options: { json?: boolean } = {},
): Promise<void> {
  const tokens = await requireAuth();
  const groupId = await getCustomerGroupId(tokens);

  await removeCartLine(tokens, groupId, lineId);

  if (options.json) {
    console.log(JSON.stringify({ success: true, lineId }, null, 2));
  } else {
    console.log(`Removed line ${lineId} from cart.`);
  }
}

/**
 * View shopping lists.
 */
export async function listCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const tokens = await requireAuth();
  const lists = await getShoppingLists(tokens);

  if (options.json) {
    console.log(JSON.stringify(lists, null, 2));
    return;
  }

  if (lists.length === 0) {
    console.log("No shopping lists found.");
    return;
  }

  for (const list of lists) {
    console.log(`  ${list.name} (${list.items?.length || 0} items)`);
    if (list.items) {
      for (const item of list.items.slice(0, 5)) {
        console.log(`    - ${item.sku}: qty ${item.quantity}`);
      }
      if (list.items.length > 5) {
        console.log(`    ... and ${list.items.length - 5} more`);
      }
    }
    console.log("");
  }
}
