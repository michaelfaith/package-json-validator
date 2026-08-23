import { Result } from './Result.ts';
import type {
  PropertyValidations,
  ValidateFunction,
} from './validate.types.ts';
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
} from './validators/index.ts';

// https://docs.npmjs.com/cli/v11/configuring-npm/package-json
// https://nodejs.org/api/packages.html
const getSpecMap = (isPrivate: boolean): PropertyValidations => ({
  author: validateAuthor,
  bin: validateBin,
  bugs: validateBugs,
  bundledDependencies: validateBundleDependencies,
  bundleDependencies: validateBundleDependencies,
  config: validateConfig,
  contributors: validateContributors,
  cpu: validateCpu,
  dependencies: validateDependencies,
  description: validateDescription,
  devDependencies: validateDependencies,
  directories: validateDirectories,
  engines: validateEngines,
  exports: validateExports,
  files: validateFiles,
  homepage: validateHomepage,
  keywords: validateKeywords,
  license: validateLicense,
  main: validateMain,
  man: validateMan,
  name: {
    required: !isPrivate,
    validate: validateName,
  },
  optionalDependencies: validateDependencies,
  os: validateOs,
  peerDependencies: validateDependencies,
  private: validatePrivate,
  publishConfig: validatePublishConfig,
  repository: validateRepository,
  scripts: validateScripts,
  sideEffects: validateSideEffects,
  type: validateType,
  version: {
    required: !isPrivate,
    validate: validateVersion,
  },
  workspaces: validateWorkspaces,
});

const parse = (data: string) => {
  if (typeof data != 'string') {
    // It's just a string
    return 'Invalid data: Input should be a string or an object';
  }
  let parsed;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    parsed = JSON.parse(data);
  } catch (e: unknown) {
    let errorMessage = 'Invalid JSON';
    if (e instanceof Error) {
      errorMessage = `Invalid JSON: ${e.toString()}`;
    }
    return errorMessage;
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    parsed instanceof Array
  ) {
    return `JSON string has invalid type. It should be an object.`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return parsed;
};

/**
 * Validate a package.json object (or string) against the npm spec.
 * @param data The package.json data to validate, either as a string or an object.
 * @param useNewReturnType This parameter is no longer necessary and will be removed in the next major version
 * @returns an object with the validation results.
 * @deprecated the second parameter is no longer necessary and will be removed in the next major version
 */
// eslint-disable-next-line @typescript-eslint/unified-signatures
export function validate(data: object | string, useNewReturnType: true): Result;

/**
 * Validate a package.json object (or string) against the npm spec.
 * @param data The package.json data to validate, either as a string or an object.
 * @returns an object with the validation results.
 */
export function validate(data: object | string): Result;
export function validate(
  data: object | string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useNewReturnType?: true,
): Result {
  const result = new Result();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parsedData = typeof data == 'object' ? data : parse(data);

  // If this is a string, then it's an error message resulting from parsing.
  if (typeof parsedData == 'string') {
    throw new Error(parsedData);
  }

  const map = getSpecMap((parsedData.private as boolean | undefined) ?? false);

  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    const name = keys[i];
    const propertyValidation = map[name];

    let validate: ValidateFunction;
    let isRequired = false;
    if (typeof propertyValidation === 'object') {
      isRequired = propertyValidation.required;
      validate = propertyValidation.validate;
    } else {
      validate = propertyValidation;
    }

    // If the property is missing and is required, then add an issue.
    if (parsedData[name] === undefined) {
      if (isRequired) {
        result.addIssue(`Missing required property: ${name}`);
      }
      continue;
    }

    // Each validator returns a Result object that will be a child of the main result.
    // This allows us to maintain the full structure of the validation results,
    // including which fields have which issues, and any nested child results for complex fields.
    const propertyResult = validate(parsedData[name]);
    result.addChildResult(i, propertyResult);
  }

  return result;
}
