import { describe, expect, it } from "vitest";

import { validateLibc } from "./validateLibc.ts";

describe(validateLibc, () => {
	it("should return no issues if the value is an empty array", () => {
		const result = validateLibc([]);
		expect(result.errorMessages).toEqual([]);
	});

	it("should return no issues if the value is an array with all valid strings", () => {
		const result = validateLibc(["glibc", "musl"]);
		expect(result.errorMessages).toEqual([]);
	});

	it("should return no issues if the value is a valid string", () => {
		const result = validateLibc("glibc");
		expect(result.errorMessages).toEqual([]);
	});

	it("should return issues if the value is an array with some non-string values", () => {
		const result = validateLibc(["glibc", null, "musl", 123]);
		expect(result.errorMessages).toEqual([
			"item at index 1 should be a string, not `null`",
			"item at index 3 should be a string, not `number`",
		]);
		expect(result.childResults).toHaveLength(4);
		expect(result.childResults[1].errorMessages).toEqual([
			"item at index 1 should be a string, not `null`",
		]);
		expect(result.childResults[3].errorMessages).toEqual([
			"item at index 3 should be a string, not `number`",
		]);
	});

	it("should return issues if the value is an array with empty strings", () => {
		const result = validateLibc(["", "glibc", "", "musl"]);
		expect(result.errorMessages).toEqual([
			"item at index 0 is empty, but should be the name of a version of libc",
			"item at index 2 is empty, but should be the name of a version of libc",
		]);
		expect(result.childResults).toHaveLength(4);
		expect(result.childResults[0].errorMessages).toEqual([
			"item at index 0 is empty, but should be the name of a version of libc",
		]);
		expect(result.childResults[2].errorMessages).toEqual([
			"item at index 2 is empty, but should be the name of a version of libc",
		]);
	});

	it("should return an issue if the value is an empty string", () => {
		let result = validateLibc("");
		expect(result.errorMessages).toEqual([
			"the value is empty, but should be the name of a version of libc",
		]);
		expect(result.issues).toHaveLength(1);

		result = validateLibc("     ");
		expect(result.errorMessages).toEqual([
			"the value is empty, but should be the name of a version of libc",
		]);
		expect(result.issues).toHaveLength(1);
	});

	it("should return issues if the value is a number", () => {
		const result = validateLibc(123);
		expect(result.errorMessages).toEqual([
			"the type should be `Array` or `string`, not `number`",
		]);
	});

	it("should return issues if the value is an object", () => {
		const result = validateLibc({});
		expect(result.issues).toEqual([
			{ message: "the type should be `Array` or `string`, not `object`" },
		]);
	});

	it("should return issues if the value is null", () => {
		const result = validateLibc(null);
		expect(result.issues).toEqual([
			{
				message: "the value is `null`, but should be an `Array` or a `string`",
			},
		]);
	});
});
