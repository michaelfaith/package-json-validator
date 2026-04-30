import { Result } from "../Result.ts";

/**
 * Validate the `browser` field in a package.json.
 * It should be a non-empty string.
 */
export const validateBrowser = (value: unknown): Result => {
	const result = new Result();

	if (typeof value !== "string") {
		if (value === null) {
			result.addIssue("the value is `null`, but should be a `string`");
		} else {
			const valueType = Array.isArray(value) ? "Array" : typeof value;
			result.addIssue(`the type should be a \`string\`, not \`${valueType}\``);
		}
	} else if (value.trim() === "") {
		result.addIssue(
			"the value is empty, but should be the path to the module that should be used in the browser",
		);
	}

	return result;
};
