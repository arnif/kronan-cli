import { describe, expect, mock, test } from "bun:test";
import { getCustomerGroupId, searchProducts } from "./api.ts";

// --- searchProducts ---

describe("searchProducts", () => {
  test("calls the correct endpoint with search body", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            count: 1,
            page: 1,
            pageCount: 1,
            hasNextPage: false,
            results: {
              hits: [
                {
                  name: "Nýmjólk",
                  sku: "100224198",
                  categoryId: 1,
                  thumbnail: "",
                  price: 199,
                  isPublished: true,
                  inProductSelection: true,
                  temporaryShortage: false,
                  priceInfo: "199 kr.",
                  chargedByWeight: false,
                  baseComparisonUnit: "l",
                },
              ],
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as unknown as typeof fetch;

    try {
      const result = await searchProducts("mjolk");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0]!;
      const [url, options] = call as unknown as [string, RequestInit];
      expect(url).toBe(
        "https://backend.kronan.is/api/products/raw-search/?with_detail=true",
      );
      expect(options.method).toBe("POST");
      const body = JSON.parse(options.body as string);
      expect(body.query).toBe("mjolk");
      expect(body.page).toBe(1);
      expect(body.pageSize).toBe(20);
      expect(body.storeExtIds).toEqual(["159"]);

      expect(result.count).toBe(1);
      expect(result.results.hits[0]!.name).toBe("Nýmjólk");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("passes custom page and pageSize", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            count: 0,
            page: 3,
            pageCount: 5,
            hasNextPage: true,
            results: { hits: [] },
          }),
          { status: 200 },
        ),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as unknown as typeof fetch;

    try {
      await searchProducts("test", { page: 3, pageSize: 5 });

      const call = mockFetch.mock.calls[0]!;
      const [, options] = call as unknown as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.page).toBe(3);
      expect(body.pageSize).toBe(5);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("throws on API error", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ detail: "Bad request" }), {
          status: 400,
        }),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      await expect(searchProducts("test")).rejects.toThrow("API error 400");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// --- getCustomerGroupId ---

describe("getCustomerGroupId", () => {
  const fakeTokens = {
    accessToken: "access",
    idToken: "id",
    refreshToken: "refresh",
    expiresAt: Date.now() + 3600000,
  };

  test("returns first group id", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify([{ id: 12345, name: "test-group", members: [] }]),
          { status: 200 },
        ),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      const id = await getCustomerGroupId(fakeTokens);
      expect(id).toBe(12345);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("throws when no groups found", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      await expect(getCustomerGroupId(fakeTokens)).rejects.toThrow(
        "No customer groups found",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("propagates API errors", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(new Response("Unauthorized", { status: 401 })),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      await expect(getCustomerGroupId(fakeTokens)).rejects.toThrow(
        "API error 401",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
