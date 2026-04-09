/**
 * Cart/checkout commands
 */

import {
  addCheckoutLines,
  getCheckout,
  getProductLists,
  type PublicCheckoutLine,
  replaceCheckoutLines,
} from "../api.ts";
import { requireAuth } from "../auth.ts";

/**
 * View current checkout contents.
 */
export async function cartViewCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const checkout = await getCheckout(token);

  if (options.json) {
    console.log(JSON.stringify(checkout, null, 2));
    return;
  }

  if (!checkout) {
    console.log("Cart is empty.");
    return;
  }

  const lines: PublicCheckoutLine[] = checkout.lines || [];
  if (lines.length === 0) {
    console.log("Cart is empty.");
    return;
  }

  console.log(`Cart (${lines.length} items):\n`);
  for (const line of lines) {
    const name = line.product?.name || "Unknown";
    const sku = line.product?.sku || "?";
    const price = line.price || line.product?.price || 0;
    console.log(
      `  [${line.id}] ${name}  x${line.quantity}  ${price} kr  = ${line.total} kr  (SKU: ${sku})`,
    );
  }
  console.log(`\n  Subtotal: ${checkout.subtotal} kr`);
  console.log(`  Bagging:  ${checkout.baggingFee} kr`);
  console.log(`  Service:  ${checkout.serviceFee} kr`);
  console.log(`  Shipping: ${checkout.shippingFee} kr`);
  console.log(`  Total:    ${checkout.total} kr`);
}

/**
 * Add item(s) to checkout.
 */
export async function cartAddCommand(
  sku: string,
  quantity: number = 1,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();

  const result = await addCheckoutLines(token, [
    { sku, quantity, substitution: true },
  ]);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Added ${quantity}x ${sku} to cart.`);
  }
}

/**
 * Set cart lines (replaces all existing lines).
 */
export async function cartSetCommand(
  lines: Array<{ sku: string; quantity: number }>,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();

  const result = await replaceCheckoutLines(
    token,
    lines.map((l) => ({ ...l, substitution: true })),
  );

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Cart updated with ${lines.length} items.`);
  }
}

/**
 * Clear the cart (remove all items).
 */
export async function cartClearCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();

  const result = await replaceCheckoutLines(token, []);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("Cart cleared.");
  }
}

/**
 * View product lists.
 */
export async function listCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const lists = await getProductLists(token);

  if (options.json) {
    console.log(JSON.stringify(lists, null, 2));
    return;
  }

  if (lists.results.length === 0) {
    console.log("No product lists found.");
    return;
  }

  for (const list of lists.results) {
    console.log(
      `  ${list.name} ${list.hasProducts ? "(has items)" : "(empty)"}`,
    );
    console.log(`    Token: ${list.token}`);
  }
}
