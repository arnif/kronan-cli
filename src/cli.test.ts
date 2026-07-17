import { describe, expect, test } from "bun:test";
import { $ } from "bun";

describe("CLI", () => {
  test("help shows usage information", async () => {
    const result = await $`bun src/index.ts help`.text();
    expect(result).toContain("kronan-cli");
    expect(result).toContain("search");
    expect(result).toContain("cart");
    expect(result).toContain("orders");
    expect(result).toContain("--json");
    expect(result).toContain("token");
  });

  test("help lists cart set/update/remove commands", async () => {
    const result = await $`bun src/index.ts help`.text();
    expect(result).toContain("cart set");
    expect(result).toContain("cart update");
    expect(result).toContain("cart remove");
    expect(result).toContain("--dry-run");
  });

  test("cart set without JSON argument errors", async () => {
    const proc = Bun.spawn(["bun", "src/index.ts", "cart", "set"], {
      stderr: "pipe",
    });
    const stderr = await new Response(proc.stderr).text();
    expect(stderr).toContain("Usage: kronan cart set");
  });

  test("cart update without --quantity errors", async () => {
    const proc = Bun.spawn(
      ["bun", "src/index.ts", "cart", "update", "02500188"],
      { stderr: "pipe" },
    );
    const stderr = await new Response(proc.stderr).text();
    expect(stderr).toContain("--quantity");
  });

  test("help documents bulk cart update JSON form", async () => {
    const result = await $`bun src/index.ts help`.text();
    expect(result).toContain("json-patch");
  });

  test("no arguments shows help", async () => {
    const result = await $`bun src/index.ts`.text();
    expect(result).toContain("kronan-cli");
  });

  test("unknown command shows error", async () => {
    const proc = Bun.spawn(["bun", "src/index.ts", "notacommand"], {
      stderr: "pipe",
    });
    const stderr = await new Response(proc.stderr).text();
    expect(stderr).toContain("Unknown command");
  });

  test("help text does not contain hardcoded phone numbers", async () => {
    const result = await $`bun src/index.ts help`.text();
    // Ensure no real phone numbers leak into help text
    expect(result).not.toContain("8430822");
  });

  test("token command without argument shows error", async () => {
    const proc = Bun.spawn(["bun", "src/index.ts", "token"], {
      stderr: "pipe",
    });
    const stderr = await new Response(proc.stderr).text();
    expect(stderr).toContain("Usage: kronan token");
  });
});
