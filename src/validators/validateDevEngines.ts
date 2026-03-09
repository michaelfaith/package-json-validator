import { Result } from "../Result.ts";
import { isPlainObject } from "../utils/index.ts";

const devEngineProperties = ["cpu", "libc", "os", "packageManager", "runtime"];
const validDevEngineObjectProperties = ["name", "version", "onFail"];
const validOnFailValues = ["warn", "error", "ignore", "download"];

/**
 * Validates an individual devEngine object, which should have the following properties:
 * - `name` (required): the name of the engine, e.g. "node", "npm", "yarn", "bun"
 * - `version` (optional): the version of the engine, which should be a valid semver range
 * - `onFail` (optional): should be one of the following values: `warn`, `error`, `ignore` or `download`
 * @example
 * {
 *   "name": "node",
 *   "version": "^20.19.0 || >=22.12.0",
 *   "onFail": "download"
 * }
 */
const validateDevEngineObject = (value: unknown): Result => {
	const result = new Result();

	if (isPlainObject(value)) {
		const keys = Object.keys(value);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const childResult = new Result();
			if (!validDevEngineObjectProperties.includes(key)) {
				childResult.addIssue(
					`unexpected property \`${key}\`; only \`name\`, \`version\`, and \`onFail\` are allowed in a devEngine object`,
				);
			}
			if (key === "name") {
				if (typeof value[key] !== "string") {
					const valueType =
						value[key] === null
							? "null"
							: Array.isArray(value[key])
								? "Array"
								: typeof value[key];
					childResult.addIssue(
						`the \`name\` property should be a string, but got \`${valueType}\``,
					);
				} else if (value[key].trim() === "") {
					childResult.addIssue("the `name` property should not be empty");
				}
			}
			if (key === "onFail") {
				if (typeof value[key] !== "string") {
					const valueType =
						value[key] === null
							? "null"
							: Array.isArray(value[key])
								? "Array"
								: typeof value[key];
					childResult.addIssue(
						`the \`onFail\` property should be a string, but got \`${valueType}\``,
					);
				} else if (!validOnFailValues.includes(value[key])) {
					childResult.addIssue(
						`the \`onFail\` property should be one of the following values: ${validOnFailValues.join(", ")}`,
					);
				}
			}
			if (key === "version") {
				if (typeof value[key] !== "string") {
					const valueType =
						value[key] === null
							? "null"
							: Array.isArray(value[key])
								? "Array"
								: typeof value[key];
					childResult.addIssue(
						`the \`version\` property should be a string, but got \`${valueType}\``,
					);
				} else if (value[key].trim() === "") {
					childResult.addIssue("the `version` property should not be empty");
				}
			}
			result.addChildResult(i, childResult);
		}
		if (!keys.includes("name")) {
			result.addIssue("missing required property `name` in devEngine object");
		}
	} else {
		const valueType = Array.isArray(value) ? "Array" : typeof value;
		result.addIssue(
			`the value should be an object with at least \`name\` and optionally \`version\` and \`onFail\`, not \`${valueType}\``,
		);
	}
	return result;
};

/**
 * Validates an entry in the `devEngines` objects, which can either be an array
 * of devEngine objects, or a single devEngine object.
 */
const validateDevEngineArrayOrObject = (value: unknown): Result => {
	let result;
	if (Array.isArray(value)) {
		result = new Result();
		for (let i = 0; i < value.length; i++) {
			const itemResult = validateDevEngineObject(value[i]);
			result.addChildResult(i, itemResult);
		}
	} else {
		result = validateDevEngineObject(value);
	}
	return result;
};

/**
 * Validates the `devEngines` field in a package.json, which should be an object
 * with any of the following properties:
 * - `cpu`
 * - `libc`
 * - `os`
 * - `packageManager`
 * - `runtime`
 *
 * The value of each property should be an object or an array objects with
 * the following properties:
 * - `name` (required): the name of the engine, e.g. "node", "npm", "yarn", "bun"
 * - `version` (optional): the version of the engine, which should be a valid semver range
 * - `onFail` (optional): should be one of the following values: `warn`, `error`, `ignore` or `download`
 * @example
 * "devEngines": {
 *   "runtime": {
 *     "name": "node",
 *     "version": "^20.19.0 || >=22.12.0",
 *     "onFail": "download"
 *   },
 *   "packageManager": {
 *     "name": "pnpm",
 *     "version": "^10.0.0",
 *     "onFail": "error"
 *   }
 * }
 * @see https://docs.npmjs.com/cli/v11/configuring-npm/package-json#devengines
 * @see https://pnpm.io/package_json#devenginesruntime
 */
export const validateDevEngines = (value: unknown): Result => {
	const result = new Result();

	if (isPlainObject(value)) {
		const keys = Object.keys(value);
		for (let i = 0; i < keys.length; i++) {
			let childResult: Result;
			const key = keys[i];

			if (devEngineProperties.includes(key)) {
				childResult = validateDevEngineArrayOrObject(value[key]);
			} else {
				childResult = new Result([
					`unexpected property \`${key}\`; only the following properties are allowed: ${devEngineProperties.join(", ")}`,
				]);
			}

			result.addChildResult(i, childResult);
		}
	} else if (value === null) {
		result.addIssue("the value is `null`, but should be an `object`");
	} else {
		const valueType = Array.isArray(value) ? "Array" : typeof value;
		result.addIssue(`the value should be an \`object\`, not \`${valueType}\``);
	}

	return result;
};
