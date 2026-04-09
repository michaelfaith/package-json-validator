import type { SpecMap } from "./Spec.types.ts";

import { Result } from "./Result.ts";
import {
	validateAuthor,
	validateBin,
	validateBugs,
	validateBundleDependencies,
	validateConfig,
	validateContributors,
	validateCpu,
	validateDependencies,
	validateDescription,
	validateDirectories,
	validateEngines,
	validateExports,
	validateFiles,
	validateHomepage,
	validateKeywords,
	validateLicense,
	validateMain,
	validateMan,
	validateName,
	validateOs,
	validatePrivate,
	validatePublishConfig,
	validateRepository,
	validateScripts,
	validateSideEffects,
	validateType,
	validateVersion,
	validateWorkspaces,
} from "./validators/index.ts";

// https://docs.npmjs.com/cli/v11/configuring-npm/package-json
// https://nodejs.org/api/packages.html
const getSpecMap = (isPrivate: boolean): SpecMap => ({
	author: {
		validate: validateAuthor,
		warning: true,
	},
	bin: { validate: validateBin },
	bugs: {
		validate: validateBugs,
		warning: true,
	},
	bundledDependencies: {
		validate: validateBundleDependencies,
	},
	bundleDependencies: {
		validate: validateBundleDependencies,
	},
	config: { validate: validateConfig },
	contributors: {
		validate: validateContributors,
	},
	cpu: { validate: validateCpu },
	dependencies: {
		recommended: true,
		validate: validateDependencies,
	},
	description: {
		validate: validateDescription,
		warning: true,
	},
	devDependencies: {
		validate: validateDependencies,
	},
	directories: {
		validate: validateDirectories,
	},
	engines: {
		recommended: true,
		validate: validateEngines,
	},
	exports: { validate: validateExports },
	files: { validate: validateFiles },
	homepage: {
		recommended: true,
		validate: validateHomepage,
	},
	keywords: {
		validate: validateKeywords,
		warning: true,
	},
	license: {
		validate: validateLicense,
		warning: true,
	},
	main: { validate: validateMain },
	man: { validate: validateMan },
	name: {
		required: !isPrivate,
		validate: validateName,
	},
	optionalDependencies: {
		validate: validateDependencies,
	},
	os: { validate: validateOs },
	peerDependencies: {
		validate: validateDependencies,
	},
	private: { validate: validatePrivate },
	publishConfig: {
		validate: validatePublishConfig,
	},
	repository: {
		validate: validateRepository,
		warning: true,
	},
	scripts: { validate: validateScripts },
	sideEffects: {
		validate: validateSideEffects,
	},
	type: {
		recommended: true,
		validate: validateType,
	},
	version: {
		required: !isPrivate,
		validate: validateVersion,
	},
	workspaces: {
		validate: validateWorkspaces,
	},
});

const parse = (data: string) => {
	if (typeof data != "string") {
		// It's just a string
		return "Invalid data - Not a string";
	}
	let parsed;
	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		parsed = JSON.parse(data);
	} catch (e: unknown) {
		let errorMessage = "Invalid JSON";
		if (e instanceof Error) {
			errorMessage = `Invalid JSON - ${e.toString()}`;
		}
		return errorMessage;
	}

	if (
		typeof parsed !== "object" ||
		parsed === null ||
		parsed instanceof Array
	) {
		return `Invalid JSON - not an object (actual type: ${typeof parsed})`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return parsed;
};

export interface ValidationOptions {
	recommendations?: boolean;
	warnings?: boolean;
}

interface LegacyValidationOutput {
	critical?: Record<string, string> | string;
	errors?: ValidationError[];
	recommendations?: string[];
	valid: boolean;
	warnings?: string[];
}

interface ValidationError {
	field: string;
	message: string;
}

/**
 * Validate a package.json object (or string) against the npm spec.
 * @param data The package.json data to validate, either as a string or an object.
 * @param options The options for validation, if using the deprecated spec name parameter.
 * @returns an object with the validation results.
 */
export function validate(
	data: object | string,
	options?: ValidationOptions,
): LegacyValidationOutput;

/**
 * Validate a package.json object (or string) against the npm spec.
 * @param data The package.json data to validate, either as a string or an object.
 * @param useNewReturnType Opt-in to use the new return type (Result) instead of the legacy output.  This is a temporary option to allow users to migrate to the new return type before it becomes the default in a future major release.
 * @returns an object with the validation results.
 */
export function validate(
	data: object | string,
	useNewReturnType: false,
): LegacyValidationOutput;

/**
 * Validate a package.json object (or string) against the npm spec.
 * @param data The package.json data to validate, either as a string or an object.
 * @param useNewReturnType Opt-in to use the new return type (Result) instead of the legacy output.  This is a temporary option to allow users to migrate to the new return type before it becomes the default in a future major release.
 * @returns an object with the validation results.
 */
export function validate(data: object | string, useNewReturnType: true): Result;
export function validate(
	data: object | string,
	optionsOrUseNewReturnType: boolean | ValidationOptions = {},
) {
	// Should we use the new return type?
	if (typeof optionsOrUseNewReturnType === "boolean") {
		if (optionsOrUseNewReturnType) {
			const result = new Result();

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const parsedData = typeof data == "object" ? data : parse(data);

			// If this is a string, then it's an error message resulting from parsing.
			// So we add it as an issue and return immediately.
			if (typeof parsedData == "string") {
				result.addIssue(parsedData);
				return result;
			}

			const map = getSpecMap(
				(parsedData.private as boolean | undefined) ?? false,
			);

			const keys = Object.keys(map);
			for (let i = 0; i < keys.length; i++) {
				const name = keys[i];
				const property = map[name];

				if (parsedData[name] === undefined) {
					if (property.required) {
						result.addIssue(`Missing required property: ${name}`);
					}
					continue;
				}

				// Each validator returns a Result object that will be a child of the main result.
				// This allows us to maintain the full structure of the validation results,
				// including which fields have which issues, and any nested child results for complex fields.
				const propertyResult = property.validate(parsedData[name]);
				result.addChildResult(i, propertyResult);
			}

			return result;
		} else {
			return validateLegacy(data, {});
		}
	} else {
		return validateLegacy(data, optionsOrUseNewReturnType);
	}
}

const validateLegacy = (
	data: object | string,
	options: ValidationOptions,
): LegacyValidationOutput => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const parsed = typeof data == "object" ? data : parse(data);
	const out: LegacyValidationOutput = { valid: false };

	if (typeof parsed == "string") {
		out.critical = parsed;
		return out;
	}

	const map = getSpecMap((parsed.private as boolean | undefined) ?? false);
	const errors: ValidationError[] = [];
	const warnings: string[] = [];
	const recommendations: string[] = [];

	let name: keyof typeof map;
	for (name in map) {
		const field = map[name];

		if (parsed[name] === undefined) {
			if (field.required) {
				errors.push({
					field: name,
					message: `Missing required field: ${name}`,
				});
			} else if (field.warning) {
				warnings.push(`Missing recommended field: ${name}`);
			} else if (field.recommended) {
				recommendations.push(`Missing optional field: ${name}`);
			}
			continue;
		}

		// Validation is expected to return an array of errors (empty means no errors)
		errors.push(
			...field
				.validate(parsed[name])
				.errorMessages.map((e) => ({ field: name, message: e })),
		);
	}

	out.valid = errors.length > 0 ? false : true;
	if (errors.length > 0) {
		out.errors = errors;
	}
	if (options.warnings !== false && warnings.length > 0) {
		out.warnings = warnings;
	}
	if (options.recommendations !== false && recommendations.length > 0) {
		out.recommendations = recommendations;
	}

	return out;
};
