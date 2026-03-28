/**
 * Order history command
 */

import { getOrder, getOrders } from "../api.ts";
import { requireAuth } from "../auth.ts";

export async function ordersCommand(
  options: { limit?: number; offset?: number; json?: boolean } = {},
): Promise<void> {
  const { limit = 15, offset = 0, json = false } = options;

  const tokens = await requireAuth();
  const data = await getOrders(tokens, { limit, offset });

  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log(`Order history (${data.count} total):\n`);

  for (const order of data.results) {
    const date = new Date(order.displayDate).toLocaleDateString("is-IS");
    const total = parseFloat(order.totalNetAmount).toLocaleString("is-IS");
    const itemCount = order.lines.length;

    console.log(
      `  #${order.id}  ${date}  ${total} kr  (${itemCount} items)  [${order.status}]`,
    );

    // Show first few items
    const preview = order.lines.slice(0, 3);
    for (const line of preview) {
      const name = line.product?.name || line.productName;
      console.log(`    - ${name} x${line.quantity}`);
    }
    if (order.lines.length > 3) {
      console.log(`    ... and ${order.lines.length - 3} more items`);
    }
    console.log("");
  }

  if (data.next) {
    console.log(`  → More orders: kronan orders --offset ${offset + limit}`);
  }
}

/**
 * Show a specific order's details
 */
export async function orderDetailCommand(
  orderId: string,
  options: { json?: boolean } = {},
): Promise<void> {
  const tokens = await requireAuth();
  const order = await getOrder(tokens, orderId);

  if (options.json) {
    console.log(JSON.stringify(order, null, 2));
    return;
  }

  const date = new Date(order.displayDate).toLocaleDateString("is-IS");
  const total = parseFloat(order.totalNetAmount).toLocaleString("is-IS");

  console.log(`Order #${order.id}`);
  console.log(`  Date:     ${date}`);
  console.log(`  Status:   ${order.status}`);
  console.log(`  Total:    ${total} kr`);
  console.log(`  Items:`);

  for (const line of order.lines) {
    const name = line.product?.name || line.productName;
    const unitPrice = parseFloat(line.unitPriceNetAmount).toLocaleString(
      "is-IS",
    );
    console.log(
      `    ${line.productSku}  ${name}  x${line.quantity}  ${unitPrice} kr/ea`,
    );
  }
}
