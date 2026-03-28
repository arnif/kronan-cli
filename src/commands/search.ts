/**
 * Product search command
 */

import { searchProducts, getProduct } from "../api.ts";
import { loadTokens } from "../auth.ts";

export async function searchCommand(
  query: string,
  options: {
    page?: number;
    pageSize?: number;
    store?: string;
    json?: boolean;
  } = {}
): Promise<void> {
  const { page = 1, pageSize = 20, store, json = false } = options;

  const result = await searchProducts(query, {
    page,
    pageSize,
    storeExtId: store,
  });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Found ${result.count} products (page ${result.page}/${result.pageCount}):\n`);

  for (const product of result.results.hits) {
    const sale = product.detail?.onSale ? " [SALE]" : "";
    const shortage = product.temporaryShortage ? " [OUT OF STOCK]" : "";
    const discount =
      product.detail?.discountPercent && product.detail.discountPercent > 0
        ? ` (${product.detail.discountPercent}% off → ${product.detail.discountedPrice} kr)`
        : "";

    console.log(`  ${product.sku}  ${product.name}`);
    console.log(`           ${product.price} kr  ${product.priceInfo}${sale}${discount}${shortage}`);
    console.log("");
  }

  if (result.hasNextPage) {
    console.log(`  → More results: kronan search "${query}" --page ${result.page + 1}`);
  }
}

export async function productDetailCommand(
  sku: string,
  options: { json?: boolean } = {}
): Promise<void> {
  const tokens = await loadTokens();
  const product = await getProduct(sku, tokens ?? undefined);

  if (options.json) {
    console.log(JSON.stringify(product, null, 2));
    return;
  }

  console.log(`${product.name}`);
  console.log(`  SKU:         ${product.sku}`);
  console.log(`  Price:       ${product.price} kr`);
  console.log(`  Price info:  ${product.priceInfo}`);
  console.log(`  Category:    ${product.category?.name || "N/A"}`);
  console.log(`  In stock:    ${product.temporaryShortage ? "No" : "Yes"}`);
  console.log(`  Image:       ${product.image}`);

  if (product.description) {
    console.log(`  Ingredients: ${product.description.substring(0, 200)}`);
  }
}
