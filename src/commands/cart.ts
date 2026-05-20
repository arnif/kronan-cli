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

export interface CartLineInput {
  sku: string;
  quantity: number;
  substitution?: boolean;
}

/**
 * Parse the JSON argument accepted by `cart set`.
 * Accepts either:
 *   - an array: [{"sku":"02500059","quantity":1,"substitution":true}]
 *   - an object map: {"02500059":1,"100151784":2}
 */
export function parseCartLinesJson(raw: string): CartLineInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Invalid JSON for cart lines: ${(err as Error).message}. Pass an array of {sku,quantity} or an object map {sku:quantity}.`,
    );
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item, idx) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Cart lines[${idx}] must be an object.`);
      }
      const obj = item as Record<string, unknown>;
      const sku = obj.sku;
      const quantity = obj.quantity;
      if (typeof sku !== "string" || sku.length === 0) {
        throw new Error(`Cart lines[${idx}].sku must be a non-empty string.`);
      }
      if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
        throw new Error(`Cart lines[${idx}].quantity must be a number.`);
      }
      if (quantity < 0 || !Number.isInteger(quantity)) {
        throw new Error(
          `Cart lines[${idx}].quantity must be a non-negative integer.`,
        );
      }
      const line: CartLineInput = { sku, quantity };
      if (typeof obj.substitution === "boolean") {
        line.substitution = obj.substitution;
      }
      return line;
    });
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed as Record<string, unknown>).map(
      ([sku, quantity]) => {
        if (sku.length === 0) {
          throw new Error("Cart lines map contains an empty SKU.");
        }
        if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
          throw new Error(
            `Cart lines map value for "${sku}" must be a number.`,
          );
        }
        if (quantity < 0 || !Number.isInteger(quantity)) {
          throw new Error(
            `Cart lines map value for "${sku}" must be a non-negative integer.`,
          );
        }
        return { sku, quantity };
      },
    );
  }

  throw new Error(
    "Cart lines JSON must be an array of {sku,quantity} or an object map {sku:quantity}.",
  );
}

function checkoutLinesToInput(lines: PublicCheckoutLine[]): CartLineInput[] {
  return lines.map((line) => ({
    sku: line.product?.sku ?? "",
    quantity: line.quantity,
    substitution: line.substitution ?? true,
  }));
}

function printPlannedLines(
  lines: CartLineInput[],
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify({ dryRun: true, lines }, null, 2));
    return;
  }
  if (lines.length === 0) {
    console.log("[dry-run] Resulting cart: empty.");
    return;
  }
  console.log(`[dry-run] Resulting cart (${lines.length} lines):`);
  for (const line of lines) {
    const sub = line.substitution === false ? " no-sub" : "";
    console.log(`  ${line.sku}  x${line.quantity}${sub}`);
  }
  console.log("[dry-run] No changes sent to API.");
}

/**
 * Set cart lines (replaces all existing lines).
 */
export async function cartSetCommand(
  lines: CartLineInput[],
  options: { json?: boolean; dryRun?: boolean } = {},
): Promise<void> {
  const normalized = lines.map((l) => ({
    sku: l.sku,
    quantity: l.quantity,
    substitution: l.substitution ?? true,
  }));

  if (options.dryRun) {
    printPlannedLines(normalized, options);
    return;
  }

  const token = await requireAuth();
  const result = await replaceCheckoutLines(token, normalized);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Cart updated with ${normalized.length} items.`);
  }
}

/**
 * Update a single cart line by SKU or numeric checkout line id.
 * Quantity of 0 removes the line.
 */
export async function cartUpdateCommand(
  identifier: string,
  quantity: number,
  options: { json?: boolean; dryRun?: boolean } = {},
): Promise<void> {
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) {
    throw new Error("--quantity must be an integer.");
  }
  if (quantity < 0) {
    throw new Error("--quantity must be 0 or greater (use 0 to remove).");
  }

  const token = await requireAuth();
  const checkout = await getCheckout(token);
  const existing: PublicCheckoutLine[] = checkout?.lines ?? [];

  const idCandidate = /^\d+$/.test(identifier)
    ? Number.parseInt(identifier, 10)
    : null;
  const matches = existing.filter(
    (line) =>
      line.product?.sku === identifier ||
      (idCandidate !== null && line.id === idCandidate),
  );
  const uniqueMatches = Array.from(
    new Map(matches.map((line) => [line.id, line])).values(),
  );

  if (uniqueMatches.length === 0) {
    throw new Error(
      `No cart line matched "${identifier}" (tried SKU and line id).`,
    );
  }
  if (uniqueMatches.length > 1) {
    const ids = uniqueMatches.map((l) => l.id).join(", ");
    throw new Error(
      `Ambiguous: "${identifier}" matched multiple cart lines (ids: ${ids}). Pass the numeric line id instead.`,
    );
  }
  const target = uniqueMatches[0]!;

  const nextLines: CartLineInput[] = checkoutLinesToInput(existing)
    .map((line) =>
      line.sku === target.product?.sku ? { ...line, quantity } : line,
    )
    .filter((line) => line.quantity > 0);

  if (options.dryRun) {
    printPlannedLines(nextLines, options);
    return;
  }

  const result = await replaceCheckoutLines(token, nextLines);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (quantity === 0) {
    console.log(
      `Removed line [${target.id}] ${target.product?.name ?? target.product?.sku ?? identifier}.`,
    );
  } else {
    console.log(
      `Updated line [${target.id}] ${target.product?.name ?? target.product?.sku ?? identifier} to quantity ${quantity}.`,
    );
  }
}

/**
 * Apply a bulk patch to the cart. Each patch entry sets the given SKU to the
 * given quantity (0 removes). SKUs not present in the patch are left untouched.
 * SKUs not currently in the cart are added when quantity > 0.
 *
 * Substitution is preserved from the existing line unless the patch entry
 * explicitly sets it; new lines default to substitution: true.
 */
export async function cartBulkUpdateCommand(
  patches: CartLineInput[],
  options: { json?: boolean; dryRun?: boolean } = {},
): Promise<void> {
  if (patches.length === 0) {
    throw new Error("Bulk update patch must contain at least one entry.");
  }

  const seen = new Set<string>();
  for (const p of patches) {
    if (seen.has(p.sku)) {
      throw new Error(`Duplicate SKU "${p.sku}" in bulk update patch.`);
    }
    seen.add(p.sku);
  }

  const token = await requireAuth();
  const checkout = await getCheckout(token);
  const existing: PublicCheckoutLine[] = checkout?.lines ?? [];

  const bySku = new Map<string, CartLineInput>();
  for (const line of checkoutLinesToInput(existing)) {
    bySku.set(line.sku, line);
  }

  for (const patch of patches) {
    const current = bySku.get(patch.sku);
    if (patch.quantity === 0) {
      bySku.delete(patch.sku);
      continue;
    }
    bySku.set(patch.sku, {
      sku: patch.sku,
      quantity: patch.quantity,
      substitution: patch.substitution ?? current?.substitution ?? true,
    });
  }

  const nextLines = Array.from(bySku.values());

  if (options.dryRun) {
    printPlannedLines(nextLines, options);
    return;
  }

  const result = await replaceCheckoutLines(token, nextLines);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const added = patches.filter(
    (p) => p.quantity > 0 && !existing.some((l) => l.product?.sku === p.sku),
  ).length;
  const removed = patches.filter(
    (p) => p.quantity === 0 && existing.some((l) => l.product?.sku === p.sku),
  ).length;
  const updated = patches.length - added - removed;
  console.log(
    `Bulk update applied: ${updated} updated, ${added} added, ${removed} removed. Cart now has ${nextLines.length} lines.`,
  );
}

/**
 * Remove a single cart line by SKU or numeric checkout line id.
 */
export async function cartRemoveCommand(
  identifier: string,
  options: { json?: boolean; dryRun?: boolean } = {},
): Promise<void> {
  await cartUpdateCommand(identifier, 0, options);
}

/**
 * Clear the cart (remove all items).
 */
export async function cartClearCommand(
  options: { json?: boolean; dryRun?: boolean } = {},
): Promise<void> {
  if (options.dryRun) {
    printPlannedLines([], options);
    return;
  }

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
