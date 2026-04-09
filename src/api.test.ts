import { describe, expect, mock, test } from "bun:test";
import { getMe, getOrder, searchProducts } from "./api.ts";

const fakeToken = { token: "test-access-token" };

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
            hits: [
              {
                name: "Nýmjólk",
                sku: "100224198",
                thumbnail: "",
                price: 199,
                discountedPrice: 199,
                discountPercent: 0,
                onSale: false,
                priceInfo: "199 kr.",
                chargedByWeight: false,
                pricePerKilo: null,
                baseComparisonUnit: "l",
                temporaryShortage: false,
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      const result = await searchProducts(fakeToken, "mjolk");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0]!;
      const [url, options] = call as unknown as [string, RequestInit];
      expect(url).toBe("https://api.kronan.is/api/v1/products/search/");
      expect(options.method).toBe("POST");
      expect(options.headers).toMatchObject({
        "Content-Type": "application/json",
        Authorization: "AccessToken test-access-token",
      });
      const body = JSON.parse(options.body as string);
      expect(body.query).toBe("mjolk");
      expect(body.page).toBe(1);

      expect(result.count).toBe(1);
      expect(result.hits[0]!.name).toBe("Nýmjólk");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("passes custom page", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            count: 0,
            page: 3,
            pageCount: 5,
            hasNextPage: true,
            hits: [],
          }),
          { status: 200 },
        ),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      await searchProducts(fakeToken, "test", { page: 3 });

      const call = mockFetch.mock.calls[0]!;
      const [, options] = call as unknown as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.page).toBe(3);
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
      await expect(searchProducts(fakeToken, "test")).rejects.toThrow(
        "API error 400",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// --- getMe ---

describe("getMe", () => {
  test("returns user identity", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ type: "user", name: "Test User" }), {
          status: 200,
        }),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      const me = await getMe(fakeToken);
      expect(me.type).toBe("user");
      expect(me.name).toBe("Test User");

      const call = mockFetch.mock.calls[0]!;
      const [url] = call as unknown as [string, RequestInit];
      expect(url).toBe("https://api.kronan.is/api/v1/me/");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("returns customer group identity", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ type: "customer_group", name: "Test Group" }),
          { status: 200 },
        ),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      const me = await getMe(fakeToken);
      expect(me.type).toBe("customer_group");
      expect(me.name).toBe("Test Group");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("handles array response (backward compatibility)", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ type: "user", name: "Test User" }]), {
          status: 200,
        }),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      const me = await getMe(fakeToken);
      expect(me.type).toBe("user");
      expect(me.name).toBe("Test User");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// --- getOrder ---

describe("getOrder", () => {
  test("fetches order by token", async () => {
    const fakeOrder = {
      token: "abc123-def456",
      created: "2025-01-01T00:00:00Z",
      status: "fulfilled",
      type: "delivery",
      total: 5000,
      discount: 0,
      deliveryDate: "2025-01-02",
      allowAlterOrderLines: false,
      lines: [],
    };

    const mockFetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(fakeOrder), { status: 200 })),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      const order = await getOrder(fakeToken, "abc123-def456");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0]!;
      const [url] = call as unknown as [string, RequestInit];
      expect(url).toBe("https://api.kronan.is/api/v1/orders/abc123-def456/");
      expect(order.token).toBe("abc123-def456");
      expect(order.status).toBe("fulfilled");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("throws on not found", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ detail: "Not found." }), { status: 404 }),
      ),
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      await expect(getOrder(fakeToken, "notfound")).rejects.toThrow(
        "API error 404",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
