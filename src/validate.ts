import type { SpecMap } from "./Spec.types.ts";

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

export type ValidateFunction = (
	data: object | string,
	options?: ValidationOptions,
) => ValidationOutput;

export interface ValidationOptions {
	recommendations?: boolean;
	warnings?: boolean;
}

export interface ValidationOutput {
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
export const validate: ValidateFunction = (
	data: object | string,
	options: ValidationOptions = {},
): ValidationOutput => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const parsed = typeof data == "object" ? data : parse(data);
	const out: ValidationOutput = { valid: false };

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
