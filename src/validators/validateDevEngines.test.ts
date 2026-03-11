import { describe, expect, it } from "vitest";

import { validateDevEngines } from "./validateDevEngines.ts";

describe(validateDevEngines, () => {
	const completeDevEngineObject = {
		name: "node",
		onFail: "warn",
		version: "^20.19.0 || >=22.12.0",
	};
	const partialDevEngineObject = {
		name: "node",
		version: "^20.19.0 || >=22.12.0",
	};
	const minimumDevEngineObject = {
		name: "node",
	};

	it.each([
		{ description: "an empty object", value: {} },
		{
			description: "a valid devEngines with all objects",
			value: {
				cpu: minimumDevEngineObject,
				libc: minimumDevEngineObject,
				os: minimumDevEngineObject,
				packageManager: partialDevEngineObject,
				runtime: completeDevEngineObject,
			},
		},
		{
			description: "a valid devEngines with arrays",
			value: { runtime: [completeDevEngineObject, partialDevEngineObject] },
		},
	])("should not return any issues for $description", ({ value }) => {
		const result = validateDevEngines(value);
		expect(result.issues).toHaveLength(0);
		expect(result.errorMessages).toEqual([]);
	});

	it.each([
		{ description: "Array", value: [] },
		{ description: "boolean", value: true },
		{ description: "number", value: 123 },
		{ description: "string", value: "test" },
	])(
		"should return an issue if the value is not an object (%description)",
		({ description, value }) => {
			const result = validateDevEngines(value);
			expect(result.issues).toHaveLength(1);
			expect(result.errorMessages).toEqual([
				`the value should be an \`object\`, not \`${description}\``,
			]);
		},
	);

	it("should return an issue if the value is not an object (null)", () => {
		const result = validateDevEngines(null);
		expect(result.issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value is `null`, but should be an `object`",
		]);
	});

	it("should return an issue if the value has unexpected properties", () => {
		const mockBadDevEnginesObject = {
			invalid: completeDevEngineObject,
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(1);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"unexpected property `invalid`; only the following properties are allowed: cpu, libc, os, packageManager, runtime",
		]);
	});

	it("should return issues if a devEngine object is missing the required `name` property", () => {
		const mockBadDevEnginesObject = {
			runtime: {
				onFail: "warn",
				version: "^20.19.0 || >=22.12.0",
			},
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(1);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"missing required property `name` in devEngine object",
		]);
	});

	it("should return issues if a devEngine object has extra properties", () => {
		const mockBadDevEnginesObject = {
			runtime: {
				invalid: "value",
				name: "some name",
				onFail: "warn",
				version: "^20.19.0 || >=22.12.0",
			},
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(1);
		expect(result.childResults[0].issues).toHaveLength(0);
		expect(result.childResults[0].childResults).toHaveLength(4);
		expect(result.childResults[0].childResults[0].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"unexpected property `invalid`; only `name`, `version`, and `onFail` are allowed in a devEngine object",
		]);
	});

	it("should return an issue if the top-level property value is not of the correct type", () => {
		const mockBadDevEnginesObject = {
			packageManager: null,
			runtime: 123,
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(2);
		expect(result.childResults[0].issues).toHaveLength(1);
		expect(result.childResults[1].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value is `null`, but should be an object with at least `name` and optionally `version` and `onFail`",
			"the value should be an object with at least `name` and optionally `version` and `onFail`, not `number`",
		]);
	});

	it("should return an issue if the nested property value is an array", () => {
		const mockBadDevEnginesObject = {
			runtime: [[completeDevEngineObject]],
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.childResults).toHaveLength(1);
		expect(result.childResults[0].childResults).toHaveLength(1);
		expect(result.childResults[0].childResults[0].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the value should be an object with at least `name` and optionally `version` and `onFail`, not `Array`",
		]);
	});

	it("should return issues if the nested devEngine object has invalid values (number)", () => {
		const mockBadDevEnginesObject = {
			runtime: {
				name: 123,
				onFail: 123,
				version: 123,
			},
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(1);
		expect(result.childResults[0].issues).toHaveLength(0);
		expect(result.childResults[0].childResults).toHaveLength(3);
		expect(result.childResults[0].childResults[0].issues).toHaveLength(1);
		expect(result.childResults[0].childResults[1].issues).toHaveLength(1);
		expect(result.childResults[0].childResults[2].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the `name` property should be a string, but got `number`",
			"the `onFail` property should be a string, but got `number`",
			"the `version` property should be a string, but got `number`",
		]);
	});

	it("should return issues if the nested devEngine object has invalid values (Array)", () => {
		const mockBadDevEnginesObject = {
			runtime: {
				name: [],
				onFail: [],
				version: [],
			},
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(1);
		expect(result.childResults[0].issues).toHaveLength(0);
		expect(result.childResults[0].childResults).toHaveLength(3);
		expect(result.childResults[0].childResults[0].issues).toHaveLength(1);
		expect(result.childResults[0].childResults[1].issues).toHaveLength(1);
		expect(result.childResults[0].childResults[2].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the `name` property should be a string, but got `Array`",
			"the `onFail` property should be a string, but got `Array`",
			"the `version` property should be a string, but got `Array`",
		]);
	});

	it("should return issues if the nested devEngine object has invalid values (null)", () => {
		const mockBadDevEnginesObject = {
			runtime: {
				name: null,
				onFail: null,
				version: null,
			},
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.issues).toHaveLength(0);
		expect(result.childResults).toHaveLength(1);
		expect(result.childResults[0].issues).toHaveLength(0);
		expect(result.childResults[0].childResults).toHaveLength(3);
		expect(result.childResults[0].childResults[0].issues).toHaveLength(1);
		expect(result.childResults[0].childResults[1].issues).toHaveLength(1);
		expect(result.childResults[0].childResults[2].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the `name` property should be a string, but got `null`",
			"the `onFail` property should be a string, but got `null`",
			"the `version` property should be a string, but got `null`",
		]);
	});

	it("should return issues if the nested devEngine object has invalid onFail value", () => {
		const mockBadDevEnginesObject = {
			runtime: {
				name: "node",
				onFail: "invalid",
			},
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.childResults[0].childResults[0].issues).toHaveLength(0);
		expect(result.childResults[0].childResults[1].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the `onFail` property should be one of the following values: warn, error, ignore, download",
		]);
	});

	it("should return issues if the nested devEngine object has empty name and version values", () => {
		const mockBadDevEnginesObject = {
			runtime: {
				name: "",
				version: "",
			},
		};
		const result = validateDevEngines(mockBadDevEnginesObject);
		expect(result.childResults[0].childResults[0].issues).toHaveLength(1);
		expect(result.childResults[0].childResults[1].issues).toHaveLength(1);
		expect(result.errorMessages).toEqual([
			"the `name` property should not be empty",
			"the `version` property should not be empty",
		]);
	});
});
