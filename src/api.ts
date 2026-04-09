/**
 * Krónan Public API Client
 *
 * Base URL: https://api.kronan.is/api/v1
 * Auth: AccessToken {token}
 *
 * Key endpoints:
 * - GET  /api/v1/me/                                    (current identity)
 * - POST /api/v1/products/search/                       (product search)
 * - GET  /api/v1/products/{sku}/                        (product detail)
 * - GET  /api/v1/categories/                            (category tree)
 * - GET  /api/v1/categories/{slug}/products/            (category products)
 * - GET  /api/v1/orders/                                (order history)
 * - GET  /api/v1/orders/{token}/                        (order detail)
 * - POST /api/v1/orders/{token}/delete-lines/           (delete order lines)
 * - POST /api/v1/orders/{token}/lower-quantity-lines/   (lower line quantity)
 * - POST /api/v1/orders/{token}/lines-toggle-substitution/ (toggle substitution)
 * - GET  /api/v1/checkout/                              (view checkout)
 * - POST /api/v1/checkout/lines/                        (add/replace checkout lines)
 * - GET  /api/v1/product-lists/                         (product lists)
 * - POST /api/v1/product-lists/                         (create product list)
 * - GET  /api/v1/product-lists/{token}/                 (product list detail)
 * - PATCH /api/v1/product-lists/{token}/                (update product list)
 * - DELETE /api/v1/product-lists/{token}/               (delete product list)
 * - POST /api/v1/product-lists/{token}/update-item/     (add/update item)
 * - GET  /api/v1/shopping-notes/                        (shopping notes)
 * - POST /api/v1/shopping-notes/add-line/               (add note line)
 * - PATCH /api/v1/shopping-notes/change-line/           (update note line)
 * - DELETE /api/v1/shopping-notes/delete-line/          (delete note line)
 * - GET  /api/v1/product-purchase-stats/                (purchase history)
 */

import type { AuthToken } from "./auth.ts";

const BASE_URL = "https://api.kronan.is/api/v1";

// --- Types ---

export interface PublicMe {
  type: "user" | "customer_group";
  name: string;
}

export interface PublicProduct {
  sku: string;
  name: string;
  thumbnail: string;
  price: number;
  discountedPrice: number;
  discountPercent: number;
  onSale: boolean;
  priceInfo: string | null;
  chargedByWeight: boolean;
  pricePerKilo: number | null;
  baseComparisonUnit: string | null;
  temporaryShortage: boolean;
}

export interface PublicProductDetail extends PublicProduct {
  description: string;
  image: string;
  qtyPerBaseCompUnit: number | null;
  countryOfOrigin: string | null;
  tags: PublicProductTag[];
}

export interface PublicProductTag {
  slug: string;
  name: string;
  image: string;
  showOnProductCard: boolean;
}

export interface PublicSearchHit extends PublicProduct {
  // Same as PublicProduct
}

export interface PublicPaginatedSearchResult {
  count: number;
  page: number;
  pageCount: number;
  hasNextPage: boolean;
  hits: PublicSearchHit[];
}

export interface PublicCategory {
  slug: string;
  name: string;
  backgroundImage: string | null;
  icon: string | null;
  children: PublicCategoryLevel1[];
}

export interface PublicCategoryLevel1 {
  slug: string;
  name: string;
  children: PublicCategoryLevel2[];
}

export interface PublicCategoryLevel2 {
  slug: string;
  name: string;
}

export interface PublicCategoryProductList {
  name: string;
  count: number;
  page: number;
  pageCount: number;
  hasNextPage: boolean;
  products: PublicProduct[];
}

export interface PublicOrderSummary {
  token: string;
  created: string;
  status: OrderStatus;
  type: OrderType | null;
  total: number;
  discount: number;
  deliveryDate: string | null;
  allowAlterOrderLines: boolean;
}

export type OrderStatus =
  | "draft"
  | "unfulfilled"
  | "partially fulfilled"
  | "fulfilled"
  | "canceled"
  | "cloned";

export type OrderType =
  | "delivery"
  | "pickup"
  | "scan_n_go"
  | "digital"
  | "digital_card_batch"
  | "dropp"
  | "navision";

export interface PublicOrder extends PublicOrderSummary {
  lines: PublicOrderLine[];
}

export interface PublicOrderLine {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  quantityOrdered: number;
  unitPrice: number;
  substitution: boolean;
  substitutionForLineId: number | null;
  isMutable: boolean;
  isLastChance: boolean;
  thumbnail: string;
  total: number;
}

export interface PaginatedPublicOrderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublicOrderSummary[];
}

export interface PublicCheckout {
  token: string;
  lines: PublicCheckoutLine[];
  total: number;
  subtotal: number;
  baggingFee: number;
  serviceFee: number;
  shippingFee: number;
  shippingFeeCutoff: number;
}

export interface PublicCheckoutLine {
  id: number;
  quantity: number;
  product: PublicProduct;
  total: number;
  price: number;
  substitution: boolean;
}

export interface PublicProductList {
  id: number;
  name: string;
  token: string;
  description: string;
}

export interface PublicProductListWithCount extends PublicProductList {
  hasProducts: boolean;
}

export interface PublicProductListDetail extends PublicProductList {
  items: PublicProductListItem[];
}

export interface PublicProductListItem {
  id: number;
  quantity: number;
  product: PublicProduct;
}

export interface PaginatedPublicProductListListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublicProductListWithCount[];
}

export interface PublicShoppingNote {
  token: string;
  name: string;
  lines: PublicShoppingNoteLine[];
}

export interface PublicShoppingNoteLine {
  token: string;
  text: string | null;
  sku: string | null;
  quantity: number;
  completed: boolean;
}

export interface PublicShoppingNoteLineArchived {
  token: string;
  text: string | null;
  sku: string | null;
  quantity: number;
  completedAt: string;
}

export interface PublicProductPurchaseStats {
  id: number;
  product: PublicProduct;
  purchaseCount: number;
  quantityPurchased: number;
  averagePurchaseQuantity: number | null;
  lastPurchaseQuantity: number;
  averagePurchaseIntervalDays: number | null;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  isIgnored: boolean;
}

export interface PublicProductPurchaseStatsListResponse {
  id: number;
  product: PublicProduct;
  purchaseCount: number;
  quantityPurchased: number;
  averagePurchaseQuantity: number | null;
  lastPurchaseQuantity: number;
  averagePurchaseIntervalDays: number | null;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  isIgnored: boolean;
}

export interface PaginatedPublicProductPurchaseStatsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublicProductPurchaseStatsListResponse[];
}

// --- API Client ---

async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: object;
    token?: AuthToken;
    params?: Record<string, string>;
  } = {},
): Promise<T> {
  const { method = "GET", body, token, params } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `AccessToken ${token.token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try {
      const json = JSON.parse(text);
      detail = json.detail || json.message || JSON.stringify(json);
    } catch {}
    throw new Error(`API error ${response.status}: ${detail}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// --- Public API Functions ---

/**
 * Get current identity (user or customer group).
 */
export async function getMe(token: AuthToken): Promise<PublicMe> {
  const result = await apiRequest<PublicMe | PublicMe[]>("/me/", { token });
  // API can return either a single object or an array with one object
  if (Array.isArray(result)) {
    if (result.length === 0) {
      throw new Error("Invalid or expired token");
    }
    return result[0]!;
  }
  return result;
}

/**
 * Search for products.
 */
export async function searchProducts(
  token: AuthToken,
  query: string,
  options: {
    page?: number;
    sortBy?: string;
    withDetail?: boolean;
  } = {},
): Promise<PublicPaginatedSearchResult> {
  const { page = 1, sortBy = "default", withDetail = true } = options;

  return apiRequest<PublicPaginatedSearchResult>("/products/search/", {
    method: "POST",
    token,
    body: {
      query,
      page,
      sortBy,
      withDetail,
    },
  });
}

/**
 * Get product detail by SKU.
 */
export async function getProduct(
  token: AuthToken,
  sku: string,
): Promise<PublicProductDetail> {
  return apiRequest<PublicProductDetail>(`/products/${sku}/`, { token });
}

/**
 * Get category tree.
 */
export async function getCategories(
  token: AuthToken,
): Promise<PublicCategory[]> {
  return apiRequest<PublicCategory[]>("/categories/", { token });
}

/**
 * Get products in a category.
 */
export async function getCategoryProducts(
  token: AuthToken,
  slug: string,
  page?: number,
): Promise<PublicCategoryProductList> {
  const params: Record<string, string> = {};
  if (page) {
    params.page = String(page);
  }
  return apiRequest<PublicCategoryProductList>(
    `/categories/${slug}/products/`,
    {
      token,
      params,
    },
  );
}

/**
 * Get order history.
 */
export async function getOrders(
  token: AuthToken,
  options: {
    limit?: number;
    offset?: number;
    type?: OrderType;
  } = {},
): Promise<PaginatedPublicOrderListResponse> {
  const { limit = 15, offset = 0, type } = options;
  const params: Record<string, string> = {
    limit: String(limit),
    offset: String(offset),
  };
  if (type) {
    params.type = type;
  }
  return apiRequest<PaginatedPublicOrderListResponse>("/orders/", {
    token,
    params,
  });
}

/**
 * Get a single order by token.
 */
export async function getOrder(
  token: AuthToken,
  orderToken: string,
): Promise<PublicOrder> {
  return apiRequest<PublicOrder>(`/orders/${orderToken}/`, { token });
}

/**
 * Delete lines from an order.
 */
export async function deleteOrderLines(
  token: AuthToken,
  orderToken: string,
  lineIds: number[],
): Promise<PublicOrder> {
  return apiRequest<PublicOrder>(`/orders/${orderToken}/delete-lines/`, {
    method: "POST",
    token,
    body: { lineIds },
  });
}

/**
 * Lower quantity of order lines.
 */
export async function lowerOrderLineQuantities(
  token: AuthToken,
  orderToken: string,
  lineIds: number[],
  quantity: number,
): Promise<PublicOrder> {
  return apiRequest<PublicOrder>(
    `/orders/${orderToken}/lower-quantity-lines/`,
    {
      method: "POST",
      token,
      body: { lineIds, quantity },
    },
  );
}

/**
 * Toggle substitution on order lines.
 */
export async function toggleOrderLineSubstitution(
  token: AuthToken,
  orderToken: string,
  lineIds: number[],
): Promise<PublicOrder> {
  return apiRequest<PublicOrder>(
    `/orders/${orderToken}/lines-toggle-substitution/`,
    {
      method: "POST",
      token,
      body: { lineIds },
    },
  );
}

// --- Checkout API Functions ---

/**
 * View the current checkout.
 */
export async function getCheckout(
  token: AuthToken,
): Promise<PublicCheckout | null> {
  const result = await apiRequest<PublicCheckout[] | PublicCheckout>(
    "/checkout/",
    { token },
  );
  // Handle both array and object responses
  if (Array.isArray(result)) {
    return result[0] ?? null;
  }
  return result ?? null;
}

/**
 * Add or replace checkout lines.
 */
export async function addCheckoutLines(
  token: AuthToken,
  lines: Array<{
    sku: string;
    quantity: number;
    substitution?: boolean;
  }>,
  replace = false,
): Promise<PublicCheckout> {
  return apiRequest<PublicCheckout>("/checkout/lines/", {
    method: "POST",
    token,
    body: {
      lines: lines.map((l) => ({
        sku: l.sku,
        quantity: l.quantity,
        substitution: l.substitution ?? true,
      })),
      replace,
    },
  });
}

/**
 * Replace all checkout lines.
 */
export async function replaceCheckoutLines(
  token: AuthToken,
  lines: Array<{
    sku: string;
    quantity: number;
    substitution?: boolean;
  }>,
): Promise<PublicCheckout> {
  return addCheckoutLines(token, lines, true);
}

// --- Product Lists API Functions ---

/**
 * Get product lists.
 */
export async function getProductLists(
  token: AuthToken,
  options: { limit?: number; offset?: number } = {},
): Promise<PaginatedPublicProductListListResponse> {
  const { limit = 15, offset = 0 } = options;
  return apiRequest<PaginatedPublicProductListListResponse>("/product-lists/", {
    token,
    params: {
      limit: String(limit),
      offset: String(offset),
    },
  });
}

/**
 * Create a product list.
 */
export async function createProductList(
  token: AuthToken,
  name: string,
  description?: string,
): Promise<PublicProductList> {
  return apiRequest<PublicProductList>("/product-lists/", {
    method: "POST",
    token,
    body: { name, description },
  });
}

/**
 * Get product list details.
 */
export async function getProductList(
  token: AuthToken,
  listToken: string,
): Promise<PublicProductListDetail> {
  return apiRequest<PublicProductListDetail>(`/product-lists/${listToken}/`, {
    token,
  });
}

/**
 * Update a product list.
 */
export async function updateProductList(
  token: AuthToken,
  listToken: string,
  updates: { name?: string; description?: string },
): Promise<PublicProductList> {
  return apiRequest<PublicProductList>(`/product-lists/${listToken}/`, {
    method: "PATCH",
    token,
    body: updates,
  });
}

/**
 * Delete a product list.
 */
export async function deleteProductList(
  token: AuthToken,
  listToken: string,
): Promise<void> {
  return apiRequest<void>(`/product-lists/${listToken}/`, {
    method: "DELETE",
    token,
  });
}

/**
 * Add or update item in product list.
 */
export async function updateProductListItem(
  token: AuthToken,
  listToken: string,
  sku: string,
  quantity: number,
): Promise<PublicProductListDetail> {
  return apiRequest<PublicProductListDetail>(
    `/product-lists/${listToken}/update-item/`,
    {
      method: "POST",
      token,
      body: { sku, quantity },
    },
  );
}

/**
 * Delete all items from product list.
 */
export async function deleteAllProductListItems(
  token: AuthToken,
  listToken: string,
): Promise<void> {
  return apiRequest<void>(`/product-lists/${listToken}/delete-all-items/`, {
    method: "DELETE",
    token,
  });
}

// --- Shopping Notes API Functions ---

/**
 * Get shopping note.
 */
export async function getShoppingNote(
  token: AuthToken,
): Promise<PublicShoppingNote> {
  const result = await apiRequest<PublicShoppingNote | PublicShoppingNote[]>(
    "/shopping-notes/",
    {
      token,
    },
  );
  // API can return either a single object or an array with one object
  if (Array.isArray(result)) {
    if (result.length === 0) {
      throw new Error("No shopping note found");
    }
    return result[0]!;
  }
  return result;
}

/**
 * Add line to shopping note.
 */
export async function addShoppingNoteLine(
  token: AuthToken,
  options: { text?: string; sku?: string; quantity?: number },
): Promise<PublicShoppingNote> {
  return apiRequest<PublicShoppingNote>("/shopping-notes/add-line/", {
    method: "POST",
    token,
    body: options,
  });
}

/**
 * Update shopping note line.
 */
export async function updateShoppingNoteLine(
  token: AuthToken,
  lineToken: string,
  updates: { text?: string; quantity?: number },
): Promise<PublicShoppingNote> {
  return apiRequest<PublicShoppingNote>("/shopping-notes/change-line/", {
    method: "PATCH",
    token,
    body: { token: lineToken, ...updates },
  });
}

/**
 * Delete shopping note line.
 */
export async function deleteShoppingNoteLine(
  token: AuthToken,
  lineToken: string,
): Promise<void> {
  return apiRequest<void>("/shopping-notes/delete-line/", {
    method: "DELETE",
    token,
    params: { token: lineToken },
  });
}

/**
 * Toggle line completion.
 */
export async function toggleShoppingNoteLineComplete(
  token: AuthToken,
  lineToken: string,
): Promise<PublicShoppingNote> {
  return apiRequest<PublicShoppingNote>(
    "/shopping-notes/toggle-complete-on-line/",
    {
      method: "PATCH",
      token,
      body: { token: lineToken },
    },
  );
}

/**
 * Get archived shopping note lines.
 */
export async function getArchivedShoppingNoteLines(
  token: AuthToken,
): Promise<PublicShoppingNoteLineArchived[]> {
  return apiRequest<PublicShoppingNoteLineArchived[]>(
    "/shopping-notes/lines-archived/",
    { token },
  );
}

/**
 * Clear shopping note (delete all lines).
 */
export async function clearShoppingNote(token: AuthToken): Promise<void> {
  return apiRequest<void>("/shopping-notes/delete-shopping-note/", {
    method: "DELETE",
    token,
  });
}

// --- Purchase Stats API Functions ---

/**
 * Get purchase history/stats.
 */
export async function getPurchaseStats(
  token: AuthToken,
  options: { limit?: number; offset?: number; includeIgnored?: boolean } = {},
): Promise<PaginatedPublicProductPurchaseStatsListResponse> {
  const { limit = 15, offset = 0, includeIgnored = false } = options;
  const params: Record<string, string> = {
    limit: String(limit),
    offset: String(offset),
    include_ignored: String(includeIgnored),
  };
  return apiRequest<PaginatedPublicProductPurchaseStatsListResponse>(
    "/product-purchase-stats/",
    {
      token,
      params,
    },
  );
}

/**
 * Set ignored status on purchase stat.
 */
export async function setPurchaseStatIgnored(
  token: AuthToken,
  id: number,
  isIgnored: boolean,
): Promise<PublicProductPurchaseStats> {
  return apiRequest<PublicProductPurchaseStats>(
    `/product-purchase-stats/${id}/set-ignored/`,
    {
      method: "PATCH",
      token,
      body: { isIgnored },
    },
  );
}
