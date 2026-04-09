/**
 * Order modification commands
 */

import {
  deleteOrderLines,
  lowerOrderLineQuantities,
  type PublicOrder,
  toggleOrderLineSubstitution,
} from "../api.ts";
import { requireAuth } from "../auth.ts";

function formatOrder(order: PublicOrder): void {
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
      `    [${line.id}] ${line.sku}  ${line.productName}  x${line.quantity}  ${unitPrice} kr/ea`,
    );
  }
}

export async function orderDeleteLinesCommand(
  orderToken: string,
  lineIds: number[],
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const order = await deleteOrderLines(token, orderToken, lineIds);

  if (options.json) {
    console.log(JSON.stringify(order, null, 2));
    return;
  }

  console.log(`Deleted ${lineIds.length} line(s) from order.`);
  console.log("");
  formatOrder(order);
}

export async function orderLowerQuantityCommand(
  orderToken: string,
  lineIds: number[],
  quantity: number,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const order = await lowerOrderLineQuantities(
    token,
    orderToken,
    lineIds,
    quantity,
  );

  if (options.json) {
    console.log(JSON.stringify(order, null, 2));
    return;
  }

  console.log(`Lowered quantity to ${quantity} for ${lineIds.length} line(s).`);
  console.log("");
  formatOrder(order);
}

export async function orderToggleSubstitutionCommand(
  orderToken: string,
  lineIds: number[],
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const order = await toggleOrderLineSubstitution(token, orderToken, lineIds);

  if (options.json) {
    console.log(JSON.stringify(order, null, 2));
    return;
  }

  console.log(`Toggled substitution for ${lineIds.length} line(s).`);
  console.log("");
  formatOrder(order);
}
