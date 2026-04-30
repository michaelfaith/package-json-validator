import { describe, expect, it } from "vitest";

import { validateGypfile } from "./validateGypfile.ts";

describe(validateGypfile, () => {
	it.each([true, false])(
		"should return no issues for boolean values '%s'",
		(type) => {
			const result = validateGypfile(type);
			expect(result.errorMessages).toEqual([]);
		},
	);

	it("should return an issue if type is not a boolean (number)", () => {
		const result = validateGypfile(123);

		expect(result.errorMessages).toEqual([
			"the value should be a `boolean`, not `number`",
		]);
	});

	it("should return error if type is not a boolean (object)", () => {
		const result = validateGypfile({});

		expect(result.errorMessages).toEqual([
			"the value should be a `boolean`, not `object`",
		]);
	});

	it("should return error if type is not a boolean (Array)", () => {
		const result = validateGypfile([]);

		expect(result.errorMessages).toEqual([
			"the value should be a `boolean`, not `Array`",
		]);
	});

	it("should return error if type is not a boolean (string)", () => {
		const result = validateGypfile("the fragile");

		expect(result.errorMessages).toEqual([
			"the value should be a `boolean`, not `string`",
		]);
	});

	it("should return error if type is a boolean string", () => {
		const result = validateGypfile("true");

		expect(result.errorMessages).toEqual([
			"the value should be a `boolean`, not `string`",
		]);
	});

	it("should return error if type is not a boolean (undefined)", () => {
		const result = validateGypfile(undefined);

		expect(result.errorMessages).toEqual([
			"the value should be a `boolean`, not `undefined`",
		]);
	});

	it("should return error if type is not a boolean (null)", () => {
		const result = validateGypfile(null);

		expect(result.errorMessages).toEqual([
			"the value is `null`, but should be a `boolean`",
		]);
	});
});
