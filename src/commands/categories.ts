/**
 * Categories commands
 */

import { getCategories, getCategoryProducts } from "../api.ts";
import { requireAuth } from "../auth.ts";

export async function categoriesCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const categories = await getCategories(token);

  if (options.json) {
    console.log(JSON.stringify(categories, null, 2));
    return;
  }

  console.log("Categories:\n");
  for (const cat of categories) {
    console.log(`  ${cat.name}`);
    if (cat.children && cat.children.length > 0) {
      for (const child1 of cat.children) {
        console.log(`    └── ${child1.name} (${child1.slug})`);
        if (child1.children && child1.children.length > 0) {
          for (const child2 of child1.children) {
            console.log(`        └── ${child2.name} (${child2.slug})`);
          }
        }
      }
    }
    console.log("");
  }
}

export async function categoryProductsCommand(
  slug: string,
  options: { page?: number; json?: boolean } = {},
): Promise<void> {
  const { page = 1, json = false } = options;
  const token = await requireAuth();
  const result = await getCategoryProducts(token, slug, page);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`${result.name} (${result.count} products):\n`);

  for (const product of result.products) {
    const sale = product.onSale ? " [SALE]" : "";
    const shortage = product.temporaryShortage ? " [OUT OF STOCK]" : "";
    console.log(`  ${product.sku}  ${product.name}`);
    console.log(
      `           ${product.price} kr  ${product.priceInfo}${sale}${shortage}`,
    );
    console.log("");
  }

  if (result.hasNextPage) {
    console.log(
      `  → More results: kronan category ${slug} --page ${result.page + 1}`,
    );
  }
}
