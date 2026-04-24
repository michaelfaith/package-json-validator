import npmPackageArg from "npm-package-arg";

import { packageFormat } from "../formats.ts";
import { ChildResult, Result } from "../Result.ts";

const parseSpecWithNpa = (
	spec: string,
): { error: string } | { result: ReturnType<typeof npmPackageArg> } => {
	try {
		const result = npmPackageArg.resolve("dummy", spec);
		return { result };
	} catch (error) {
		if (
			!(error instanceof Error) ||
			!("code" in error && typeof error.code === "string")
		) {
			return { error: "" };
		}

		const { code, message: rawErrorMessage } = error;

		let errorMessage = rawErrorMessage;
		// The message contains the dummy package name, should use custom message
		if (code === "EINVALIDTAGNAME") {
			errorMessage =
				"invalid tag name: tags may not have any characters that encodeURIComponent encodes";
		}

		return { error: errorMessage };
	}
};

const isUnpublished = (
	npaResult: ReturnType<typeof parseSpecWithNpa> | undefined,
	spec: string,
): boolean => {
	if (!npaResult || "error" in npaResult) {
		// pnpm catalogs (`catalog:`) could be published or unpublished.
		// Ideally linting would validate the catalog itself, and then we could ignore
		// the package names here since they'd be correctly validated there.
		// But the catalog is elsewhere, and the better assumption is that it mostly
		// has published packages.
		return spec.startsWith("workspace:") || spec.startsWith("patch:");
	}

	const { type } = npaResult.result;
	return (
		type === "git" ||
		type === "directory" ||
		type === "file" ||
		type === "remote" ||
		type === "alias"
	);
};

const PACKAGE_MANAGER_SPECIFIC_PROTOCOLS = [
	"jsr", // https://jsr.io/docs/using-packages
	"catalog", // https://pnpm.io/next/catalogs
	"workspace", // https://pnpm.io/next/workspaces#workspace-protocol-workspace
	"patch", // https://yarnpkg.com/protocol/patch
];

/**
 * Validates dependencies, making sure the object is a set of key value pairs
 * with package names and versions
 * @returns An array with validation errors (if any violations are found)
 */
export const validateDependencies = (value: unknown): Result => {
	const result = new Result();

	if (value == null) {
		result.addIssue(
			"the value is `null`, but should be a record of dependencies",
		);
	} else if (typeof value === "object" && !Array.isArray(value)) {
		const entries = Object.entries(value);
		for (let i = 0; i < entries.length; ++i) {
			const entry = entries[i];
			const pkg = entry[0];
			const spec = entry[1] as unknown;

			const isSpecString = typeof spec === "string";
			const npaResult = isSpecString ? parseSpecWithNpa(spec) : undefined;

			const childResult = new ChildResult(i);
			result.addChildResult(childResult);

			if (
				!packageFormat.test(pkg) &&
				!(isSpecString && isUnpublished(npaResult, spec))
			) {
				childResult.addIssue(`invalid dependency package name: \`${pkg}\``);
			}

			if (isSpecString && npaResult) {
				if (!("result" in npaResult)) {
					const isPackageManagerSpecificNotation =
						PACKAGE_MANAGER_SPECIFIC_PROTOCOLS.some((protocol) =>
							spec.startsWith(`${protocol}:`),
						);

					if (!isPackageManagerSpecificNotation) {
						childResult.addIssue(
							`invalid version spec for dependency \`${pkg}\`: ${npaResult.error || spec}`,
						);
					}
				}
			} else {
				childResult.addIssue(
					`dependency version for \`${pkg}\` should be a string: ${spec}`,
				);
			}
		}
	} else {
		const valueType = Array.isArray(value) ? "array" : typeof value;
		result.addIssue(`the type should be \`object\`, not \`${valueType}\``);
	}

	return result;
};
