import { describe, expect, it } from "vitest";

import { validateBugs } from "./validateBugs.ts";

describe(validateBugs, () => {
	it.each([
		{ description: "URL string", value: "http://example.com/bugs" },
		{
			description: "object with only email",
			value: { email: "test@example.com" },
		},
		{
			description: "object with only url",
			value: { url: "http://example.com/bugs" },
		},
		{
			description: "object with email and url",
			value: { email: "test@example.com", url: "http://example.com/bugs" },
		},
	])(
		"should return no errors if the value is a valid %description",
		({ value }) => {
			const result = validateBugs(value);
			expect(result.issues).toHaveLength(0);
			expect(result.errorMessages).toEqual([]);
		},
	);

	it("should return an issue if the string is not a valid URL", () => {
		const result = validateBugs("invalidString");
		expect(result.issues).toHaveLength(1);
		expect(result.errorMessages).toEqual(["the value should be a URL"]);
	});

	it("should return an issue if the object has none of the required properties", () => {
		const result = validateBugs({});
		expect(result.issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the object should have at least one of these properties: email, url",
		]);
	});

	it("should return an issue if the object has an invalid email", () => {
		const result = validateBugs({ email: "invalidEmail" });
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(1);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value of `email` should be a valid email address",
		]);
	});

	it("should return an issue if the object has an invalid url", () => {
		const result = validateBugs({ url: "invalidUrl" });
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(1);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value of `url` should be a valid URL",
		]);
	});

	it("should return issues if the object has both invalid email and url", () => {
		const result = validateBugs({
			email: "invalidEmail",
			url: "invalidUrl",
		});
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(2);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.childResults[1].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value of `email` should be a valid email address",
			"the value of `url` should be a valid URL",
		]);
	});

	it.each([
		{ description: "array", value: [] },
		{ description: "boolean", value: true },
		{ description: "null", value: null },
		{ description: "number", value: 123 },
	])(
		"should return an issue if the value is neither a string nor an object (%description)",
		({ value }) => {
			const result = validateBugs(value);
			expect(result.issues).toHaveLength(1);
			expect(result.errorMessages).toEqual([
				"the value should be either a string URL or an object with `email` and / or `url` properties",
			]);
		},
	);

	it("should return issues if the object has invalid types for both email and url", () => {
		const result = validateBugs({
			email: 123,
			url: null,
		});
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(2);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.childResults[1].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value of `email` should be a string",
			"the value of `url` should be a string",
		]);
	});

	it("should return issues if the object has properties that don't belong", () => {
		const result = validateBugs({
			email: "test@example.com",
			invalidProperty: "value",
			url: "http://example.com/bugs",
		});
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(3);
		expect(result.childResults[0].issues).toHaveLength(0);
		expect(result.childResults[1].issues).toHaveLength(1);
		expect(result.childResults[2].issues).toHaveLength(0);
		expect(result.errorMessages).toEqual([
			'unexpected property "invalidProperty". Only "email" and "url" are allowed',
		]);
	});
});
