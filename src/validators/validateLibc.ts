import { ChildResult, Result } from "../Result.ts";

/**
 * Validate the `libc` field in a package.json, which can either be
 * a string or an Array of strings.
 * @example ["glibc", "musl"]
 * @see https://docs.npmjs.com/cli/v11/configuring-npm/package-json#libc
 */
export const validateLibc = (obj: unknown): Result => {
	const result = new Result();

	if (typeof obj === "string") {
		if (obj.trim() === "") {
			result.addIssue(
				"the value is empty, but should be the name of a version of libc",
			);
		}
	} else if (Array.isArray(obj)) {
		// If it's an array, check if all items are valid strings
		for (let i = 0; i < obj.length; i++) {
			const childResult = new ChildResult(i);
			const item: unknown = obj[i];
			if (typeof item !== "string") {
				const itemType = item === null ? "null" : typeof item;
				childResult.addIssue(
					`item at index ${i} should be a string, not \`${itemType}\``,
				);
			} else if (item.trim() === "") {
				childResult.addIssue(
					`item at index ${i} is empty, but should be the name of a version of libc`,
				);
			}
			result.addChildResult(childResult);
		}
	} else if (obj == null) {
		result.addIssue(
			"the value is `null`, but should be an `Array` or a `string`",
		);
	} else {
		const valueType = typeof obj;
		result.addIssue(
			`the type should be \`Array\` or \`string\`, not \`${valueType}\``,
		);
	}

	return result;
};
