import { beforeEach, describe, expect, it, vi } from "vitest";

import { validateFunding } from "./validateFunding.ts";

describe(validateFunding, () => {
	const mockBadFundingObject = {
		email: "treznor@nin.com",
		type: "patreon",
	};
	const mockGoodFundingObject = {
		type: "patreon",
		url: "https://www.patreon.com/treznor",
	};
	const mockBadFundingString = "not-a-url";
	const mockGoodFundingString = "https://www.patreon.com/treznor";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each([
		{ description: "a valid funding object", value: mockGoodFundingObject },
		{ description: "a valid funding string", value: mockGoodFundingString },
		{
			description: "a valid funding array",
			value: [
				mockGoodFundingObject,
				mockGoodFundingString,
				mockGoodFundingObject,
			],
		},
	])("should not return any issues for $description", ({ value }) => {
		const result = validateFunding(value);
		expect(result.issues).toHaveLength(0);
		expect(result.errorMessages).toEqual([]);
	});

	it("should return an issue if the value is not an object, string, or array", () => {
		const result = validateFunding(123);
		expect(result.issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value should be an object with `type` and `url`, a string, or an Array of the two",
		]);
	});

	it("should return an issue if the value is a string that's not a valid url", () => {
		const result = validateFunding(mockBadFundingString);
		expect(result.issues).toHaveLength(1);
		expect(result.errorMessages).toEqual(["the value should be a valid URL"]);
	});

	it("should return an issue if the value is an empty string", () => {
		const result = validateFunding("");
		expect(result.issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value is empty, but should be a URL",
		]);
	});

	it("should return issues if the value is a funding object with url missing and an extra property", () => {
		const result = validateFunding(mockBadFundingObject);
		expect(result.issues).toHaveLength(1);
		expect(result.childResults).toHaveLength(2);
		expect(result.errorMessages).toEqual([
			"missing required property `url` in funding object",
			"unexpected property `email`; only `type` and `url` are allowed in a funding object",
		]);
	});

	it("should return issues if the value is a funding object with type missing", () => {
		const result = validateFunding({ url: mockGoodFundingString });
		expect(result.issues).toHaveLength(1);
		expect(result.childResults).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"missing required property `type` in funding object",
		]);
	});

	it("should return issues if the value is a funding object with invalid property values (number)", () => {
		const mockFundingObjectWithInvalidValues = {
			type: 123,
			url: 123,
		};
		const result = validateFunding(mockFundingObjectWithInvalidValues);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(2);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.childResults[1].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the `type` property should be a string, but got number",
			"the `url` property should be a string, but got number",
		]);
	});

	it("should return issues if the value is a funding object with invalid property values (null)", () => {
		const mockFundingObjectWithInvalidValues = {
			type: null,
			url: null,
		};
		const result = validateFunding(mockFundingObjectWithInvalidValues);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(2);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.childResults[1].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the `type` property should be a string, but got null",
			"the `url` property should be a string, but got null",
		]);
	});

	it("should return issues if the value is a funding object with invalid property values (empty string)", () => {
		const mockFundingObjectWithInvalidValues = {
			type: "",
			url: "",
		};
		const result = validateFunding(mockFundingObjectWithInvalidValues);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(2);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.childResults[1].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the `type` property should not be empty",
			"the `url` property should not be empty",
		]);
	});

	it("should return issues if the value is a funding object with invalid property values (invalid url)", () => {
		const mockFundingObjectWithInvalidValues = {
			type: "patreon",
			url: mockBadFundingString,
		};
		const result = validateFunding(mockFundingObjectWithInvalidValues);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(2);
		expect(result.childResults[0].issues).toHaveLength(0);
		expect(result.childResults[1].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the `url` property should be a valid URL",
		]);
	});

	it("should return issues if the value is an array with some invalid items", () => {
		const result = validateFunding([
			mockBadFundingObject,
			mockGoodFundingObject,
			mockBadFundingString,
		]);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(3);
		const badFundingObjectResult = result.childResults[0];
		const goodFundingObjectResult = result.childResults[1];
		const badFundingStringResult = result.childResults[2];
		expect(badFundingObjectResult.errorMessages).toHaveLength(2);
		expect(goodFundingObjectResult.errorMessages).toHaveLength(0);
		expect(badFundingStringResult.errorMessages).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"missing required property `url` in funding object",
			"unexpected property `email`; only `type` and `url` are allowed in a funding object",
			"the value should be a valid URL",
		]);
	});

	it("should return issues if the value is an array with items of invalid type", () => {
		const result = validateFunding([[], 123, null]);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(3);
		const arrayFundingItemResult = result.childResults[0];
		const numberFundingItemResult = result.childResults[1];
		const nullFundingItemResult = result.childResults[2];
		expect(arrayFundingItemResult.errorMessages).toHaveLength(1);
		expect(numberFundingItemResult.errorMessages).toHaveLength(1);
		expect(nullFundingItemResult.errorMessages).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value should be an object with `type` and `url` or a string URL",
			"the value should be an object with `type` and `url` or a string URL",
			"the value should be an object with `type` and `url` or a string URL",
		]);
	});
});
