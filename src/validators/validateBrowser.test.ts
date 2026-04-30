import { describe, expect, it } from "vitest";

import { validateBrowser } from "./validateBrowser.ts";

describe(validateBrowser, () => {
	it("should return no issues for a string", () => {
		const result = validateBrowser("index.js");

		expect(result.errorMessages).toEqual([]);
	});

	it("should return an issue if the value is not a string (number)", () => {
		const result = validateBrowser(123);

		expect(result.errorMessages).toEqual([
			"the type should be a `string`, not `number`",
		]);
	});

	it("should return an issue if the value is not a string (object)", () => {
		const result = validateBrowser({});

		expect(result.errorMessages).toEqual([
			"the type should be a `string`, not `object`",
		]);
	});

	it("should return an issue if the value is not a string (Array)", () => {
		const result = validateBrowser([]);

		expect(result.errorMessages).toEqual([
			"the type should be a `string`, not `Array`",
		]);
	});

	it("should return an issue if value is not a string (boolean)", () => {
		const result = validateBrowser(true);

		expect(result.errorMessages).toEqual([
			"the type should be a `string`, not `boolean`",
		]);
	});

	it("should return an issue if value is not a string (undefined)", () => {
		const result = validateBrowser(undefined);

		expect(result.errorMessages).toEqual([
			"the type should be a `string`, not `undefined`",
		]);
	});

	it("should return an issue if value is not a string (null)", () => {
		const result = validateBrowser(null);

		expect(result.errorMessages).toEqual([
			"the value is `null`, but should be a `string`",
		]);
	});

	it("should return an issue if the value is an empty string", () => {
		const result = validateBrowser("");

		expect(result.errorMessages).toEqual([
			"the value is empty, but should be the path to the module that should be used in the browser",
		]);
	});

	it("should return an issue if the value is whitespace only", () => {
		const result = validateBrowser("   ");

		expect(result.errorMessages).toEqual([
			"the value is empty, but should be the path to the module that should be used in the browser",
		]);
	});
});
