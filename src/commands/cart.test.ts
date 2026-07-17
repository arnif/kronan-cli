import { describe, expect, test } from "bun:test";
import { parseCartLinesJson } from "./cart.ts";

describe("parseCartLinesJson", () => {
  test("parses array of {sku, quantity}", () => {
    const lines = parseCartLinesJson(
      '[{"sku":"02500059","quantity":1},{"sku":"100151784","quantity":2}]',
    );
    expect(lines).toEqual([
      { sku: "02500059", quantity: 1 },
      { sku: "100151784", quantity: 2 },
    ]);
  });

  test("preserves substitution when present in array form", () => {
    const lines = parseCartLinesJson(
      '[{"sku":"02500059","quantity":1,"substitution":false}]',
    );
    expect(lines).toEqual([
      { sku: "02500059", quantity: 1, substitution: false },
    ]);
  });

  test("parses object map {sku:quantity}", () => {
    const lines = parseCartLinesJson('{"02500059":1,"100151784":2}');
    expect(lines.length).toBe(2);
    expect(lines).toEqual(
      expect.arrayContaining([
        { sku: "02500059", quantity: 1 },
        { sku: "100151784", quantity: 2 },
      ]),
    );
  });

  test("rejects invalid JSON", () => {
    expect(() => parseCartLinesJson("not json")).toThrow(/Invalid JSON/);
  });

  test("rejects negative quantities in array form", () => {
    expect(() =>
      parseCartLinesJson('[{"sku":"02500059","quantity":-1}]'),
    ).toThrow(/non-negative integer/);
  });

  test("rejects negative quantities in map form", () => {
    expect(() => parseCartLinesJson('{"02500059":-1}')).toThrow(
      /non-negative integer/,
    );
  });

  test("rejects non-integer quantities", () => {
    expect(() =>
      parseCartLinesJson('[{"sku":"02500059","quantity":1.5}]'),
    ).toThrow(/non-negative integer/);
  });

  test("rejects missing sku", () => {
    expect(() => parseCartLinesJson('[{"quantity":1}]')).toThrow(
      /sku must be a non-empty string/,
    );
  });

  test("rejects non-number map value", () => {
    expect(() => parseCartLinesJson('{"02500059":"1"}')).toThrow(
      /must be a number/,
    );
  });

  test("rejects scalar JSON", () => {
    expect(() => parseCartLinesJson("42")).toThrow(
      /must be an array.*or an object map/,
    );
  });
});
