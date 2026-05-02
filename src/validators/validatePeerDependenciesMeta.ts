import { packageFormat } from "../formats.ts";
import { ChildResult, Result } from "../Result.ts";
import { isPlainObject } from "../utils/index.ts";

/**
 * Validates the `peerDependenciesMeta` field in a package.json.
 * The field must be an object whose keys are valid package names and whose
 * values are objects with only an `optional` property of boolean type.
 * @example
 * {
 *   "peerDependenciesMeta": {
 *     "react": {
 *       "optional": true
 *     }
 *   }
 * }
 * @see https://docs.npmjs.com/cli/v11/configuring-npm/package-json#peerdependenciesmeta
 */
export const validatePeerDependenciesMeta = (value: unknown): Result => {
	const result = new Result();

	if (value == null) {
		result.addIssue(
			"the value is `null`, but should be an object with peer dependency metadata",
		);
	} else if (typeof value === "object" && !Array.isArray(value)) {
		const entries: [string, unknown][] = Object.entries(value);

		for (let i = 0; i < entries.length; i++) {
			const [pkg, pkgMeta] = entries[i];
			const childResult = new ChildResult(i);

			if (!packageFormat.test(pkg)) {
				childResult.addIssue(`invalid package name: \`${pkg}\``);
			}

			if (!isPlainObject(pkgMeta)) {
				const pkgMetaType =
					pkgMeta === null
						? "null"
						: Array.isArray(pkgMeta)
							? "Array"
							: typeof pkgMeta;
				childResult.addIssue(
					`the peer dependency metadata for \`${pkg}\` should be an object, not \`${pkgMetaType}\``,
				);
			} else {
				const keys = Object.keys(pkgMeta);

				for (let j = 0; j < keys.length; j++) {
					const key = keys[j];
					const grandChildResult = new ChildResult(j);
					childResult.addChildResult(grandChildResult);

					if (key === "optional") {
						if (typeof pkgMeta[key] !== "boolean") {
							const optionalType =
								pkgMeta[key] === null
									? "null"
									: Array.isArray(pkgMeta[key])
										? "Array"
										: typeof pkgMeta[key];
							grandChildResult.addIssue(
								`the value should be a boolean, not \`${optionalType}\``,
							);
						}
					} else {
						grandChildResult.addIssue(
							`unexpected property \`${key}\`; only \`optional\` is allowed in peer dependency metadata`,
						);
					}
				}

				if (!keys.includes("optional")) {
					childResult.addIssue(
						`the peer dependency metadata for \`${pkg}\` should contain the \`optional\` property`,
					);
				}
			}

			result.addChildResult(childResult);
		}
	} else {
		const valueType = Array.isArray(value) ? "Array" : typeof value;
		result.addIssue(`the type should be \`object\`, not \`${valueType}\``);
	}

	return result;
};
