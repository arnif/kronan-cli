/**
 * Purchase statistics commands
 */

import { getPurchaseStats, setPurchaseStatIgnored } from "../api.ts";
import { requireAuth } from "../auth.ts";

export async function statsCommand(
  options: {
    limit?: number;
    offset?: number;
    includeIgnored?: boolean;
    json?: boolean;
  } = {},
): Promise<void> {
  const {
    limit = 15,
    offset = 0,
    includeIgnored = false,
    json = false,
  } = options;
  const token = await requireAuth();
  const result = await getPurchaseStats(token, {
    limit,
    offset,
    includeIgnored,
  });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Purchase statistics (${result.count} products):\n`);

  for (const stat of result.results) {
    if (stat.isIgnored && !includeIgnored) continue;

    const product = stat.product;
    const avgQty = stat.averagePurchaseQuantity?.toFixed(1) || "N/A";
    const interval = stat.averagePurchaseIntervalDays?.toFixed(0) || "N/A";
    const lastDate = stat.lastPurchaseDate
      ? new Date(stat.lastPurchaseDate).toLocaleDateString("is-IS")
      : "N/A";

    console.log(`  ${product.sku}  ${product.name}`);
    console.log(
      `           ${stat.purchaseCount} purchases, ${stat.quantityPurchased} total qty`,
    );
    console.log(`           Avg: ${avgQty} qty/order, every ${interval} days`);
    console.log(
      `           Last: ${lastDate} (${stat.lastPurchaseQuantity} qty)`,
    );
    if (stat.isIgnored) {
      console.log(`           [IGNORED]`);
    }
    console.log("");
  }

  if (result.next) {
    console.log(`  → More: kronan stats --offset ${offset + limit}`);
  }
}

export async function statsIgnoreCommand(
  id: number,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const stat = await setPurchaseStatIgnored(token, id, true);

  if (options.json) {
    console.log(JSON.stringify(stat, null, 2));
    return;
  }

  console.log(`Ignored product: ${stat.product.name}`);
}

export async function statsUnignoreCommand(
  id: number,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const stat = await setPurchaseStatIgnored(token, id, false);

  if (options.json) {
    console.log(JSON.stringify(stat, null, 2));
    return;
  }

  console.log(`Unignored product: ${stat.product.name}`);
}
