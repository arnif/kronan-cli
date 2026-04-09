/**
 * Product search command
 */

import { getProduct, searchProducts } from "../api.ts";
import { loadToken } from "../auth.ts";

export async function searchCommand(
  query: string,
  options: {
    page?: number;
    pageSize?: number;
    store?: string;
    json?: boolean;
  } = {},
): Promise<void> {
  const { page = 1, json = false } = options;

  const token = await loadToken();
  if (!token) {
    throw new Error(
      "No access token found. Create one at https://kronan.is/adgangur/adgangslyklar and run 'kronan token <your-token>'",
    );
  }

  const result = await searchProducts(token, query, { page });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(
    `Found ${result.count} products (page ${result.page}/${result.pageCount}):\n`,
  );

  for (const product of result.hits) {
    const sale = product.onSale ? " [SALE]" : "";
    const shortage = product.temporaryShortage ? " [OUT OF STOCK]" : "";
    const discount =
      product.discountPercent && product.discountPercent > 0
        ? ` (${product.discountPercent}% off → ${product.discountedPrice} kr)`
        : "";

    console.log(`  ${product.sku}  ${product.name}`);
    console.log(
      `           ${product.price} kr  ${product.priceInfo}${sale}${discount}${shortage}`,
    );
    console.log("");
  }

  if (result.hasNextPage) {
    console.log(
      `  → More results: kronan search "${query}" --page ${result.page + 1}`,
    );
  }
}

export async function productDetailCommand(
  sku: string,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await loadToken();
  if (!token) {
    throw new Error(
      "No access token found. Create one at https://kronan.is/adgangur/adgangslyklar and run 'kronan token <your-token>'",
    );
  }

  const product = await getProduct(token, sku);

  if (options.json) {
    console.log(JSON.stringify(product, null, 2));
    return;
  }

  console.log(`${product.name}`);
  console.log(`  SKU:         ${product.sku}`);
  console.log(`  Price:       ${product.price} kr`);
  console.log(`  Price info:  ${product.priceInfo}`);
  console.log(`  In stock:    ${product.temporaryShortage ? "No" : "Yes"}`);
  console.log(`  Image:       ${product.image}`);

  if (product.description) {
    console.log(`  Description: ${product.description.substring(0, 200)}`);
  }

  if (product.tags && product.tags.length > 0) {
    console.log(`  Tags:        ${product.tags.map((t) => t.name).join(", ")}`);
  }
}
