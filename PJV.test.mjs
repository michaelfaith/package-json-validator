import { assert, describe, it, test } from "vitest";

import { PJV } from "./PJV.js";

function getPackageJson(extra) {
	const out = {
		name: "test-package",
		version: "0.5.0",
	};
	if (extra) {
		for (const name in extra) {
			out[name] = extra[name];
		}
	}
	return out;
}
const npmWarningFields = {
	author: "Nick Sullivan <nick@sullivanflock.com>",
	description: "This is my description",
	keywords: ["keyword1", "keyword2", "keyword3"],
	bugs: "http://example.com/bugs",
	repository: {
		type: "git",
		url: "git@github.com:JoshuaKGoldberg/package-json-validator.git",
	},
	licenses: [{ type: "MIT", url: "http://example.com/license" }],
	contributors: ["Nick Sullivan <nick@sullivanflock.com>"],
};

describe("Basic", () => {
	test("Input types", function () {
		assert.ok(PJV.validate("string").critical, "string");
		assert.ok(PJV.validate("{").critical, "malformed object");
		assert.ok(PJV.validate("[]").critical, "array");
		assert.ok(PJV.validate('"malformed"').critical, "quoted string");
		assert.ok(PJV.validate("42").critical, "number");
		assert.ok(PJV.validate("null").critical, "null");
		assert.ok(PJV.validate("true").critical, "true");
		assert.ok(PJV.validate("false").critical, "false");
		assert.ok(PJV.validate({}).critical, "literal object");
	});
});
describe("NPM", () => {
	test("Field formats", function () {
		assert.ok(PJV.packageFormat.test("a"), "one alphanumeric character");
		assert.ok(PJV.packageFormat.test("abcABC123._-"), "url safe characters");
		assert.equal(PJV.packageFormat.test(".abc123"), false, "starts with dot");
		assert.equal(
			PJV.packageFormat.test("_abc123"),
			false,
			"starts with underscore",
		);
		assert.equal(
			PJV.validatePeople("people", "Barney Rubble").length,
			0,
			"author string: name",
		);
		assert.equal(
			PJV.validatePeople(
				"people",
				"Barney Rubble <b@rubble.com> (http://barneyrubble.tumblr.com/)",
			).length,
			0,
			"author string: name, email, url",
		);
		assert.equal(
			PJV.validatePeople(
				"people",
				"<b@rubble.com> (http://barneyrubble.tumblr.com/)",
			).length > 0,
			1,
			"author string: name required",
		);
		assert.equal(
			PJV.validate(
				JSON.stringify(getPackageJson({ bin: "./path/to/program" })),
				"npm",
			).valid,
			true,
			"bin: can be string",
		);
		assert.equal(
			PJV.validate(
				JSON.stringify(
					getPackageJson({ bin: { "my-project": "./path/to/program" } }),
				),
				"npm",
			).valid,
			true,
			"bin: can be object",
		);
		assert.equal(
			PJV.validate(
				JSON.stringify(getPackageJson({ bin: ["./path/to/program"] })),
				"npm",
			).valid,
			false,
			"bin: can't be an array",
		);
		assert.equal(
			PJV.validate(
				JSON.stringify(
					getPackageJson({ dependencies: { bad: { version: "3.3.3" } } }),
				),
				"npm",
			).valid,
			false,
			"version should be a string",
		);
	});

	describe("Dependencies Ranges", function () {
		test("Smoke", () => {
			const json = getPackageJson({
				dependencies: {
					star: "*",
					empty: "",
					url: "https://github.com/JoshuaKGoldberg/package-json-validator",
					"caret-first": "^1.0.0",
					"tilde-first": "~1.2",
					"x-version": "1.2.x",
					"tilde-top": "~1",
					"caret-top": "^1",
					"workspace-package-no-range": "workspace:",
					"workspace-package-caret": "workspace:^",
					"workspace-package-any": "workspace:*",
					"workspace-package-tilde-version": "workspace:~1.2.3",
					"workspace-gt-version": "workspace:>1.2.3",
					"catalog-package": "catalog:",
					"catalog-named-package": "catalog:react19",
					"svgo-v1": "npm:svgo@1.3.2",
					"svgo-v2": "npm:svgo@2.0.3",
				},
				devDependencies: {
					range: "1.2.3 - 2.3.4",
					lteq: "<=1.2.3",
					gteq: ">=1.2.3",
					"verion-build": "1.2.3+build2012",
					lt: "<1.2.3",
					gt: ">1.2.3",
				},
				peerDependencies: {
					range: "1.2.3 - 2.3.4",
					lteq: "<=1.2.3",
					gteq: ">=1.2.3",
					"verion-build": "1.2.3+build2012",
					lt: "<1.2.3",
					gt: ">1.2.3",
				},
			});
			const result = PJV.validate(JSON.stringify(json), "npm", {
				warnings: false,
				recommendations: false,
			});
			assert.equal(result.valid, true, JSON.stringify(result));
			assert.equal(result.critical, undefined, JSON.stringify(result));
		});

		it("reports a complaint when devDependencies has an invalid range", () => {
			const json = getPackageJson({
				devDependencies: {
					"package-name": "abc123",
				},
			});

			const result = PJV.validate(JSON.stringify(json), "npm");

			assert.deepStrictEqual(result.errors, [
				"Invalid version range for dependency package-name: abc123",
			]);
		});

		it("reports a complaint when peerDependencies has an invalid range", () => {
			const json = getPackageJson({
				peerDependencies: {
					"package-name": "abc123",
				},
			});

			const result = PJV.validate(JSON.stringify(json), "npm");

			assert.deepStrictEqual(result.errors, [
				"Invalid version range for dependency package-name: abc123",
			]);
		});
	});

	test("Dependencies with scope", function () {
		// reference: https://github.com/JoshuaKGoldberg/package-json-validator/issues/49
		const json = getPackageJson({
			dependencies: {
				star: "*",
				empty: "",
				url: "https://github.com/JoshuaKGoldberg/package-json-validator",
				"@reactivex/rxjs": "^5.0.0-alpha.7",
			},
		});
		const result = PJV.validate(JSON.stringify(json), "npm", {
			warnings: false,
			recommendations: false,
		});
		assert.equal(result.valid, true, JSON.stringify(result));
		assert.equal(result.critical, undefined, JSON.stringify(result));
	});

	test("Required fields", function () {
		let json = getPackageJson();
		let result = PJV.validate(JSON.stringify(json), "npm", {
			warnings: false,
			recommendations: false,
		});
		assert.equal(result.valid, true, JSON.stringify(result));
		assert.equal(result.critical, undefined, JSON.stringify(result));

		["name", "version"].forEach(function (field) {
			json = getPackageJson();
			delete json[field];
			result = PJV.validate(JSON.stringify(json), "npm", {
				warnings: false,
				recommendations: false,
			});
			assert.equal(result.valid, false, JSON.stringify(result));
			assert.equal(result.warnings, undefined, JSON.stringify(result));
		});
		["name", "version"].forEach(function (field) {
			json = getPackageJson();
			json["private"] = true;
			delete json[field];
			result = PJV.validate(JSON.stringify(json), "npm", {
				warnings: false,
				recommendations: false,
			});
			assert.equal(result.valid, true, JSON.stringify(result));
			assert.equal(result.warnings, undefined, JSON.stringify(result));
		});
	});

	test("Warning fields", function () {
		let json = getPackageJson(npmWarningFields);
		let result = PJV.validate(JSON.stringify(json), "npm", {
			warnings: true,
			recommendations: false,
		});
		assert.equal(result.valid, true, JSON.stringify(result));
		assert.equal(result.critical, undefined, JSON.stringify(result));

		for (const field in npmWarningFields) {
			json = getPackageJson(npmWarningFields);
			delete json[field];
			result = PJV.validate(JSON.stringify(json), "npm", {
				warnings: true,
				recommendations: false,
			});
			assert.equal(result.valid, true, JSON.stringify(result));
			assert.equal(
				result.warnings && result.warnings.length,
				1,
				JSON.stringify(result),
			);
		}
	});

	test("Recommended fields", function () {
		const recommendedFields = {
			homepage: "http://example.com",
			engines: { node: ">=0.10.3 <0.12" },
			dependencies: { "package-json-validator": "*" },
		};
		let json = getPackageJson(recommendedFields);
		let result = PJV.validate(JSON.stringify(json), "npm", {
			warnings: false,
			recommendations: true,
		});
		assert.equal(result.valid, true, JSON.stringify(result));
		assert.equal(result.critical, undefined, JSON.stringify(result));

		for (const field in recommendedFields) {
			json = getPackageJson(recommendedFields);
			delete json[field];
			result = PJV.validate(JSON.stringify(json), "npm", {
				warnings: false,
				recommendations: true,
			});
			assert.equal(result.valid, true, JSON.stringify(result));
			assert.equal(
				result.recommendations && result.recommendations.length,
				1,
				JSON.stringify(result),
			);
		}
	});

	test("Licenses", function () {
		// https://docs.npmjs.com/cli/v9/configuring-npm/package-json#license

		// licenses as an array
		let json = getPackageJson(npmWarningFields);
		let result = PJV.validate(JSON.stringify(json), "npm", {
			warnings: true,
			recommendations: false,
		});
		assert.equal(result.valid, true, JSON.stringify(result));
		assert.equal(result.critical, undefined, JSON.stringify(result));
		assert.equal(result.warnings, undefined, JSON.stringify(result));

		// licenses as a single type
		json = getPackageJson(npmWarningFields);
		delete json.licenses;
		json.license = "MIT";
		result = PJV.validate(JSON.stringify(json), "npm", {
			warnings: true,
			recommendations: false,
		});
		assert.equal(result.valid, true, JSON.stringify(result));
		assert.equal(result.critical, undefined, JSON.stringify(result));
		assert.equal(result.warnings, undefined, JSON.stringify(result));

		// neither
		json = getPackageJson(npmWarningFields);
		delete json.licenses;
		result = PJV.validate(JSON.stringify(json), "npm", {
			warnings: true,
			recommendations: false,
		});
		assert.equal(result.valid, true, JSON.stringify(result));
		assert.equal(result.critical, undefined, JSON.stringify(result));
		assert.equal(
			result.warnings && result.warnings.length,
			1,
			JSON.stringify(result),
		);
	});
});
