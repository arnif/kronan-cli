/**
 * Product lists commands (full CRUD)
 */

import {
  createProductList,
  deleteAllProductListItems,
  deleteProductList,
  getProductList,
  getProductLists,
  type PublicProductListDetail,
  updateProductList,
  updateProductListItem,
} from "../api.ts";
import { requireAuth } from "../auth.ts";

function formatProductList(list: PublicProductListDetail): void {
  console.log(`${list.name}`);
  if (list.description) {
    console.log(`  Description: ${list.description}`);
  }
  console.log(`  Token: ${list.token}`);
  console.log(`  Items:`);

  if (list.items.length === 0) {
    console.log("    (empty)");
  } else {
    for (const item of list.items) {
      console.log(
        `    ${item.product.sku}  ${item.product.name}  x${item.quantity}`,
      );
    }
  }
}

export async function listsCommand(
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

  console.log(`Product lists (${lists.count} total):\n`);
  for (const list of lists.results) {
    console.log(
      `  ${list.name} ${list.hasProducts ? "(has items)" : "(empty)"}`,
    );
    console.log(`    Token: ${list.token}`);
  }
}

export async function listDetailCommand(
  listToken: string,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const list = await getProductList(token, listToken);

  if (options.json) {
    console.log(JSON.stringify(list, null, 2));
    return;
  }

  formatProductList(list);
}

export async function listCreateCommand(
  name: string,
  options: { description?: string; json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const list = await createProductList(token, name, options.description);

  if (options.json) {
    console.log(JSON.stringify(list, null, 2));
    return;
  }

  console.log(`Created list: ${list.name}`);
  console.log(`  Token: ${list.token}`);
}

export async function listUpdateCommand(
  listToken: string,
  updates: { name?: string; description?: string },
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const list = await updateProductList(token, listToken, updates);

  if (options.json) {
    console.log(JSON.stringify(list, null, 2));
    return;
  }

  console.log(`Updated list: ${list.name}`);
}

export async function listDeleteCommand(
  listToken: string,
  _options: { force?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  await deleteProductList(token, listToken);

  console.log(`Deleted list: ${listToken}`);
}

export async function listAddItemCommand(
  listToken: string,
  sku: string,
  quantity: number,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const list = await updateProductListItem(token, listToken, sku, quantity);

  if (options.json) {
    console.log(JSON.stringify(list, null, 2));
    return;
  }

  console.log(`Added/updated item: ${sku} x${quantity}`);
  console.log("");
  formatProductList(list);
}

export async function listRemoveItemCommand(
  listToken: string,
  sku: string,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  // Set quantity to 0 to remove
  const list = await updateProductListItem(token, listToken, sku, 0);

  if (options.json) {
    console.log(JSON.stringify(list, null, 2));
    return;
  }

  console.log(`Removed item: ${sku}`);
  console.log("");
  formatProductList(list);
}

export async function listClearCommand(
  listToken: string,
  _options: { force?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  await deleteAllProductListItems(token, listToken);

  console.log(`Cleared all items from list: ${listToken}`);
}
