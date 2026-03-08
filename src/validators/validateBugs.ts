import { emailFormat, urlFormat } from "../formats.ts";
import { Result } from "../Result.ts";
import { isPlainObject } from "../utils/index.ts";

/**
 * Validates the bugs field, which can be a URL and / or an email address.
 * {
 *   "url" : "http://github.com/owner/project/issues",
 *   "email" : "project@hostname.com"
 * }
 * It can also be a string URL.
 */
export const validateBugs = (value: unknown): Result => {
	const result = new Result();

	if (typeof value === "string") {
		if (!urlFormat.test(value)) {
			result.addIssue("the value should be a URL");
		}
	} else if (isPlainObject(value)) {
		const keys = Object.keys(value);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const keyValue = value[key];
			const childResult = new Result();
			if (key === "email") {
				if (typeof keyValue !== "string") {
					childResult.addIssue("the value of `email` should be a string");
				} else if (!emailFormat.test(keyValue)) {
					childResult.addIssue(
						"the value of `email` should be a valid email address",
					);
				}
			} else if (key === "url") {
				if (typeof keyValue !== "string") {
					childResult.addIssue("the value of `url` should be a string");
				} else if (!urlFormat.test(keyValue)) {
					childResult.addIssue("the value of `url` should be a valid URL");
				}
			} else {
				childResult.addIssue(
					`unexpected property "${key}". Only "email" and "url" are allowed`,
				);
			}
			result.addChildResult(i, childResult);
		}
		if (!keys.includes("email") && !keys.includes("url")) {
			result.addIssue(
				"the object should have at least one of these properties: email, url",
			);
		}
	} else {
		result.addIssue(
			"the value should be either a string URL or an object with `email` and / or `url` properties",
		);
	}
	return result;
};
