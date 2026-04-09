/**
 * Order history commands
 */

import { getOrder, getOrders } from "../api.ts";
import { requireAuth } from "../auth.ts";

export async function ordersCommand(
  options: { limit?: number; offset?: number; json?: boolean } = {},
): Promise<void> {
  const { limit = 15, offset = 0, json = false } = options;

  const token = await requireAuth();
  const data = await getOrders(token, { limit, offset });

  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log(`Order history (${data.count} total):\n`);

  for (const order of data.results) {
    const date = new Date(order.created).toLocaleDateString("is-IS");
    const total = order.total.toLocaleString("is-IS");

    console.log(
      `  ${order.token.substring(0, 8)}...  ${date}  ${total} kr  [${order.status}]`,
    );
  }

  if (data.next) {
    console.log(`  → More orders: kronan orders --offset ${offset + limit}`);
  }
}

/**
 * Show a specific order's details
 */
export async function orderDetailCommand(
  orderToken: string,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const order = await getOrder(token, orderToken);

  if (options.json) {
    console.log(JSON.stringify(order, null, 2));
    return;
  }

  const date = new Date(order.created).toLocaleDateString("is-IS");
  const total = order.total.toLocaleString("is-IS");

  console.log(`Order ${order.token}`);
  console.log(`  Date:     ${date}`);
  console.log(`  Status:   ${order.status}`);
  console.log(`  Type:     ${order.type || "N/A"}`);
  console.log(`  Total:    ${total} kr`);
  console.log(`  Items:`);

  for (const line of order.lines) {
    const unitPrice = line.unitPrice.toLocaleString("is-IS");
    console.log(
      `    ${line.sku}  ${line.productName}  x${line.quantity}  ${unitPrice} kr/ea`,
    );
  }
}
