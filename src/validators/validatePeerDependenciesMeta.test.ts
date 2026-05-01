import { describe, expect, it } from "vitest";

import { validatePeerDependenciesMeta } from "./validatePeerDependenciesMeta.ts";

describe(validatePeerDependenciesMeta, () => {
	it("should return a Result with no issues for valid peerDependenciesMeta metadata", () => {
		const result = validatePeerDependenciesMeta({
			"@scope/package": { optional: false },
			react: { optional: true },
		});

		expect(result.errorMessages).toEqual([]);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(2);
		result.childResults.forEach((childResult) => {
			expect(childResult.issues).toHaveLength(0);
		});
	});

	it("should return an issue when peerDependenciesMeta is null", () => {
		const result = validatePeerDependenciesMeta(null);

		expect(result.errorMessages).toEqual([
			"the value is `null`, but should be an object with peer dependency metadata",
		]);
	});

	it("should return an issue when peerDependenciesMeta is not an object (Array)", () => {
		const result = validatePeerDependenciesMeta(["react"]);

		expect(result.errorMessages).toEqual([
			"the type should be `object`, not `Array`",
		]);
	});

	it("should return an issue when peerDependenciesMeta is not an object (number)", () => {
		const result = validatePeerDependenciesMeta(13);

		expect(result.errorMessages).toEqual([
			"the type should be `object`, not `number`",
		]);
	});

	it("should return an issue for invalid package names", () => {
		const result = validatePeerDependenciesMeta({
			"": { optional: true },
			"invalid package": { optional: false },
		});

		expect(result.childResults).toHaveLength(2);
		expect(result.childResults[0].errorMessages).toEqual([
			"invalid package name: ``",
		]);
		expect(result.childResults[1].errorMessages).toEqual([
			"invalid package name: `invalid package`",
		]);
	});

	it("should return issues for invalid peer dependency metadata values", () => {
		const result = validatePeerDependenciesMeta({
			"@scope/package": [true],
			react: null,
			typescript: 123,
		});

		expect(result.childResults).toHaveLength(3);
		expect(result.childResults[0].errorMessages).toEqual([
			"the value for peer dependency metadata `@scope/package` should be an object, not `Array`",
		]);
		expect(result.childResults[1].errorMessages).toEqual([
			"the value for peer dependency metadata `react` should be an object, not `null`",
		]);
		expect(result.childResults[2].errorMessages).toEqual([
			"the value for peer dependency metadata `typescript` should be an object, not `number`",
		]);
	});

	it("should return an issue when optional is not a boolean", () => {
		const result = validatePeerDependenciesMeta({
			"@scope/package": {
				optional: [true],
			},
			react: {
				optional: "true",
			},
			typescript: {
				optional: null,
			},
		});

		expect(result.childResults).toHaveLength(3);
		expect(result.childResults[0].childResults).toHaveLength(1);
		expect(result.childResults[0].childResults[0].issues).toHaveLength(1);
		expect(result.childResults[0].childResults[0].errorMessages).toEqual([
			"the `optional` property for peer dependency metadata `@scope/package` should be a boolean, not `Array`",
		]);
		expect(result.childResults[1].childResults).toHaveLength(1);
		expect(result.childResults[1].childResults[0].issues).toHaveLength(1);
		expect(result.childResults[1].childResults[0].errorMessages).toEqual([
			"the `optional` property for peer dependency metadata `react` should be a boolean, not `string`",
		]);
		expect(result.childResults[2].childResults[0].issues).toHaveLength(1);
		expect(result.childResults[2].childResults[0].errorMessages).toEqual([
			"the `optional` property for peer dependency metadata `typescript` should be a boolean, not `null`",
		]);
	});

	it("should return an issue for unexpected properties in metadata objects", () => {
		const result = validatePeerDependenciesMeta({
			react: {
				optional: true,
				someOtherKey: false,
			},
		});

		expect(result.childResults[0].issues).toHaveLength(0);
		expect(result.childResults[0].childResults).toHaveLength(2);
		expect(result.childResults[0].childResults[0].issues).toHaveLength(0);
		expect(result.childResults[0].childResults[1].issues).toHaveLength(1);
		expect(result.childResults[0].childResults[1].errorMessages).toEqual([
			"unexpected property `someOtherKey`; only `optional` is allowed in peer dependency metadata",
		]);
	});

	it("should return an issue when optional is missing from the metadata object", () => {
		const result = validatePeerDependenciesMeta({
			react: {},
		});

		expect(result.childResults[0].errorMessages).toEqual([
			"peer dependency metadata for `react` should contain the `optional` property",
		]);
	});
});
