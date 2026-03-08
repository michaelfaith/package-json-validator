import { urlFormat } from "../formats.ts";
import { Result } from "../Result.ts";
import { isPlainObject } from "../utils/index.ts";

/**
 * The object should consist of only the properties `type` and `url`, both of which are required.
 * Both properties should be non-empty strings, and the `url` property should be a valid URL.
 */
const validateFundingObject = (value: Record<string, unknown>): Result => {
	const result = new Result();
	const keys = Object.keys(value);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const childResult = new Result();
		if (key !== "type" && key !== "url") {
			childResult.addIssue(
				`unexpected property \`${key}\`; only \`type\` and \`url\` are allowed in a funding object`,
			);
		}
		if (key === "type") {
			if (typeof value[key] !== "string") {
				const valueType = value[key] === null ? "null" : typeof value[key];
				childResult.addIssue(
					`the \`type\` property should be a string, but got ${valueType}`,
				);
			} else if (value[key].trim() === "") {
				childResult.addIssue("the `type` property should not be empty");
			}
		}
		if (key === "url") {
			if (typeof value[key] !== "string") {
				const valueType = value[key] === null ? "null" : typeof value[key];
				childResult.addIssue(
					`the \`url\` property should be a string, but got ${valueType}`,
				);
			} else if (value[key].trim() === "") {
				childResult.addIssue("the `url` property should not be empty");
			} else if (!urlFormat.test(value[key])) {
				childResult.addIssue("the `url` property should be a valid URL");
			}
		}
		result.addChildResult(i, childResult);
	}
	if (!keys.includes("type")) {
		result.addIssue("missing required property `type` in funding object");
	}
	if (!keys.includes("url")) {
		result.addIssue("missing required property `url` in funding object");
	}
	return result;
};

const validateFundingString = (value: string): Result => {
	const result = new Result();
	if (value.trim() === "") {
		result.addIssue("the value is empty, but should be a URL");
	} else if (!urlFormat.test(value)) {
		result.addIssue("the value should be a valid URL");
	}
	return result;
};

const validateFundingItem = (value: unknown): Result => {
	let result = new Result();
	if (typeof value === "string") {
		result = validateFundingString(value);
	} else if (isPlainObject(value)) {
		result = validateFundingObject(value);
	} else {
		result.addIssue(
			"the value should be an object with `type` and `url`, a string, or an Array of the two",
		);
	}
	return result;
};

/**
 * Validate the `funding` field in a package.json, which should either be
 * 1. an object containing a `type` and `url` field
 * 2. a simple string URL
 * 3. or an array of the above two
 *
 * [
 *   {
 *     "type": "patreon",
 *     "url": "https://www.patreon.com/user"
 *   },
 *   "http://npmjs.com/donate-also",
 * ]
 */
export const validateFunding = (value: unknown): Result => {
	let result = new Result();

	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			const item: unknown = value[i];
			const childResult = validateFundingItem(item);
			result.addChildResult(i, childResult);
		}
	} else {
		result = validateFundingItem(value);
	}
	return result;
};
