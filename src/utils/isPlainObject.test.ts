import { describe, expect, it } from "vitest";

import { isPlainObject } from "./isPlainObject.ts";

describe(isPlainObject, () => {
	it("should return true for a plain object", () => {
		expect(isPlainObject({})).toBe(true);
		expect(isPlainObject({ key: "value" })).toBe(true);
	});

	it("should return false for an array", () => {
		expect(isPlainObject([])).toBe(false);
		expect(isPlainObject([1, 2, 3])).toBe(false);
	});

	it("should return false for null", () => {
		expect(isPlainObject(null)).toBe(false);
	});

	it("should return false for undefined", () => {
		expect(isPlainObject(undefined)).toBe(false);
	});

	it("should return false for a string", () => {
		expect(isPlainObject("string")).toBe(false);
	});

	it("should return false for a number", () => {
		expect(isPlainObject(42)).toBe(false);
	});

	it("should return false for a boolean", () => {
		expect(isPlainObject(true)).toBe(false);
		expect(isPlainObject(false)).toBe(false);
	});
});
