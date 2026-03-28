/**
 * Krónan Backend API Client
 *
 * Base URL: https://backend.kronan.is/api/
 * Auth: CognitoJWT {idToken}
 *
 * Key endpoints:
 * - POST /api/products/raw-search/?with_detail=true       (product search)
 * - GET  /api/products/{sku}/                              (product detail by SKU)
 * - GET  /api/orders/                                      (order history)
 * - GET  /api/users/me/                                    (user profile)
 * - GET  /api/stores/                                      (store listing)
 * - GET  /api/store-categories/                            (category tree)
 * - GET  /api/smart-checkouts/default/                     (view cart)
 * - POST /api/smart-checkouts/default/lines/               (add to cart)
 * - PATCH /api/smart-checkouts/default/lines/{lineId}/    (update cart line)
 * - DELETE /api/smart-checkouts/default/lines/{lineId}/    (remove from cart)
 * - GET  /api/customer_groups/                             (customer groups)
 * - GET  /api/product_list/                                (shopping lists)
 * - POST /api/product_list/                                (create shopping list)
 */

import type { AuthTokens } from "./auth.ts";

const BASE_URL = "https://backend.kronan.is/api";

// Default store extId - Krónan Granda (Reykjavik, supports picking)
const DEFAULT_STORE_EXT_ID = "159";

// --- Types ---

export interface Product {
  name: string;
  sku: string;
  categoryId: number;
  thumbnail: string;
  price: number;
  isPublished: boolean;
  inProductSelection: boolean;
  temporaryShortage: boolean;
  priceInfo: string;
  chargedByWeight: boolean;
  baseComparisonUnit: string;
  detail?: {
    discountedPrice: number;
    discountPercent: number;
    onSale: boolean;
    tags: Array<{
      slug: string;
      name: string;
      image: string;
      showOnProductCard: boolean;
    }>;
  };
}

export interface SearchResult {
  count: number;
  page: number;
  pageCount: number;
  hasNextPage: boolean;
  results: {
    hits: Product[];
  };
}

export interface OrderLine {
  id: number;
  productName: string;
  productSku: string;
  quantity: number;
  quantityFulfilled: number;
  unitPriceNetAmount: string;
  product: {
    id: number;
    name: string;
    sku: string;
    price: number;
    thumbnail: string;
    category: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export interface Order {
  id: number;
  orderId: string;
  token: string;
  created: string;
  displayDate: string;
  status: string;
  totalNetAmount: string;
  discountAmount: string;
  lines: OrderLine[];
}

export interface OrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export interface UserProfile {
  id: number;
  email: string;
  phoneNumber: string;
  name: string;
  ssn: string;
  defaultShippingAddress: number;
  defaultBillingAddress: number;
  mostLikelyPickingStoreId: number;
  mostLikelyPickingStoreIds: number[];
  bagless: boolean;
  substitution: boolean;
}

export interface Store {
  id: number;
  extId: string;
  name: string;
  displayName: string;
  address: string;
  city: string;
  postalCode: string;
  hasPicking: boolean;
  hasPickup: boolean;
  isScanNGo: boolean;
  isWholesale: boolean;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  backgroundImage?: string;
  icon?: string;
  children?: Category[];
}

// --- API Client ---

async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: object;
    tokens?: AuthTokens;
    params?: Record<string, string>;
    extraHeaders?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = "GET", body, tokens, params, extraHeaders } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: "https://www.kronan.is",
  };

  if (tokens) {
    headers["Authorization"] = `CognitoJWT ${tokens.idToken}`;
  }

  if (extraHeaders) {
    Object.assign(headers, extraHeaders);
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
      detail = json.detail || json.message || text;
    } catch {}
    throw new Error(`API error ${response.status}: ${detail}`);
  }

  return (await response.json()) as T;
}

// --- Public API Functions ---

/**
 * Search for products.
 */
export async function searchProducts(
  query: string,
  options: {
    page?: number;
    pageSize?: number;
    storeExtId?: string;
    onlyInSelection?: boolean;
    sortBy?: string;
  } = {}
): Promise<SearchResult> {
  const {
    page = 1,
    pageSize = 20,
    storeExtId = DEFAULT_STORE_EXT_ID,
    onlyInSelection = false,
    sortBy = "default",
  } = options;

  return apiRequest<SearchResult>(
    "/products/raw-search/?with_detail=true",
    {
      method: "POST",
      body: {
        query,
        onlyInSelection,
        onlyInSpecializedSelection: false,
        page,
        pageSize,
        storeExtIds: [storeExtId],
        includeWholesale: false,
        sortBy,
      },
    }
  );
}

/**
 * Get product detail by SKU.
 */
export async function getProduct(
  sku: string,
  tokens?: AuthTokens
): Promise<any> {
  return apiRequest(`/products/${sku}/`, { tokens });
}

/**
 * Get order history.
 */
export async function getOrders(
  tokens: AuthTokens,
  options: { limit?: number; offset?: number } = {}
): Promise<OrdersResponse> {
  const { limit = 15, offset = 0 } = options;
  return apiRequest<OrdersResponse>("/orders/", {
    tokens,
    params: {
      limit: String(limit),
      offset: String(offset),
    },
  });
}

/**
 * Get user profile.
 */
export async function getUserProfile(
  tokens: AuthTokens
): Promise<UserProfile> {
  return apiRequest<UserProfile>("/users/me/", { tokens });
}

/**
 * Get all stores.
 */
export async function getStores(): Promise<Store[]> {
  return apiRequest<Store[]>("/stores/");
}

/**
 * Get category tree (for online store).
 */
export async function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>("/store-categories/");
}

// --- Cart Types ---

export interface CustomerGroup {
  id: number;
  name: string;
  members: Array<{
    id: number;
    name: string;
    phoneNumber: string;
    ssn: string;
    isAdmin: boolean;
  }>;
}

export interface CartLine {
  id: number;
  quantity: number;
  sku: string;
  product: {
    id: number;
    name: string;
    sku: string;
    price: number;
    thumbnail: string;
    chargedByWeight: boolean;
    category?: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export interface Cart {
  id: number;
  lines: CartLine[];
  totalPrice?: number;
  [key: string]: any;
}

// --- Cart API Functions ---

/**
 * Get customer groups (needed for Customer-Group-Id header).
 */
export async function getCustomerGroups(
  tokens: AuthTokens
): Promise<CustomerGroup[]> {
  return apiRequest<CustomerGroup[]>("/customer_groups/", { tokens });
}

/**
 * Get the customer group ID (first group).
 * Throws if no customer groups are found.
 */
export async function getCustomerGroupId(
  tokens: AuthTokens
): Promise<number> {
  const groups = await getCustomerGroups(tokens);
  if (groups.length === 0) {
    throw new Error(
      "No customer groups found. Your account may not be part of a group."
    );
  }
  return groups[0]!.id;
}

function cartHeaders(customerGroupId: number): Record<string, string> {
  return { "Customer-Group-Id": String(customerGroupId) };
}

/**
 * View the current cart (smart checkout).
 */
export async function getCart(
  tokens: AuthTokens,
  customerGroupId: number
): Promise<Cart> {
  return apiRequest<Cart>("/smart-checkouts/default/", {
    tokens,
    extraHeaders: cartHeaders(customerGroupId),
  });
}

/**
 * Add items to cart.
 */
export async function addToCart(
  tokens: AuthTokens,
  customerGroupId: number,
  lines: Array<{ sku: string; quantity: number; source?: string }>
): Promise<any> {
  return apiRequest("/smart-checkouts/default/lines/", {
    method: "POST",
    tokens,
    extraHeaders: cartHeaders(customerGroupId),
    body: {
      lines: lines.map((l) => ({
        quantity: l.quantity,
        sku: l.sku,
        source: l.source || "search",
      })),
      force: false,
    },
  });
}

/**
 * Update a cart line quantity.
 */
export async function updateCartLine(
  tokens: AuthTokens,
  customerGroupId: number,
  lineId: number,
  quantity: number
): Promise<any> {
  return apiRequest(`/smart-checkouts/default/lines/${lineId}/`, {
    method: "PATCH",
    tokens,
    extraHeaders: cartHeaders(customerGroupId),
    body: { quantity },
  });
}

/**
 * Remove a line from the cart.
 */
export async function removeCartLine(
  tokens: AuthTokens,
  customerGroupId: number,
  lineId: number
): Promise<void> {
  const url = `${BASE_URL}/smart-checkouts/default/lines/${lineId}/`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: "https://www.kronan.is",
    Authorization: `CognitoJWT ${tokens.idToken}`,
    "Customer-Group-Id": String(customerGroupId),
  };

  const response = await fetch(url, { method: "DELETE", headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
  // DELETE may return 204 No Content
}

// --- Shopping Lists ---

/**
 * Get shopping lists.
 */
export async function getShoppingLists(tokens: AuthTokens): Promise<any[]> {
  return apiRequest<any[]>("/product_list/", { tokens });
}

/**
 * Create a shopping list.
 */
export async function createShoppingList(
  tokens: AuthTokens,
  name: string,
  items: Array<{ sku: string; quantity: number }>
): Promise<any> {
  return apiRequest("/product_list/", {
    method: "POST",
    tokens,
    body: { name, items },
  });
}
