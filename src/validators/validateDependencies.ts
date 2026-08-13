import npmPackageArg from 'npm-package-arg';

import { packageFormat } from '../formats.ts';
import { ChildResult, Result } from '../Result.ts';

type ParseArgReturn =
  | {
      error: string;
      result?: never;
    }
  | {
      error?: never;
      result: ReturnType<typeof npmPackageArg>;
    };

const parsePackageArg = (arg: string): ParseArgReturn => {
  try {
    const result = npmPackageArg(arg);
    return { result };
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error && typeof error.code === 'string')
    ) {
      return { error: '' };
    }

    return { error: error.message };
  }
};

const parseSpecWithNpa = (spec: string): ParseArgReturn => {
  try {
    const result = npmPackageArg.resolve('dummy', spec);
    return { result };
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error && typeof error.code === 'string')
    ) {
      return { error: '' };
    }

    const { code, message: rawErrorMessage } = error;

    let errorMessage = rawErrorMessage;
    // The message contains the dummy package name, should use custom message
    if (code === 'EINVALIDTAGNAME') {
      errorMessage =
        'tags may not have any characters that encodeURIComponent encodes';
    }

    return { error: errorMessage };
  }
};

const isUnpublished = (
  npaResult: ReturnType<typeof parseSpecWithNpa> | undefined,
  spec: string,
): boolean => {
  if (!npaResult || 'error' in npaResult) {
    // pnpm catalogs (`catalog:`) could be published or unpublished.
    // Ideally linting would validate the catalog itself, and then we could ignore
    // the package names here since they'd be correctly validated there.
    // But the catalog is elsewhere, and the better assumption is that it mostly
    // has published packages.
    return spec.startsWith('workspace:') || spec.startsWith('patch:');
  }

  const { type } = npaResult.result;
  return (
    type === 'git' ||
    type === 'directory' ||
    type === 'file' ||
    type === 'remote' ||
    type === 'alias'
  );
};

const PACKAGE_MANAGER_SPECIFIC_PROTOCOLS = [
  'catalog', // https://pnpm.io/next/catalogs
  'jsr', // https://jsr.io/docs/using-packages
  'link', // https://yarnpkg.com/protocol/link
  'patch', // https://yarnpkg.com/protocol/patch
  'workspace', // https://pnpm.io/next/workspaces#workspace-protocol-workspace
];

const parseProtocol = /^.+?:(\S+)/;

export interface ValidateDependenciesOptions {
  allowNamedRegistries?: boolean;
}

/**
 * Validates dependencies, making sure the object is a set of key value pairs
 * with package names and versions
 * @returns An array with validation errors (if any violations are found)
 */
export const validateDependencies = (
  value: unknown,
  { allowNamedRegistries }: ValidateDependenciesOptions = {},
): Result => {
  const result = new Result();

  if (value == null) {
    result.addIssue(
      'the value is `null`, but should be a record of dependencies',
    );
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value);
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];
      const pkg = entry[0];
      const spec = entry[1] as unknown;

      const isSpecString = typeof spec === 'string';
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
        if (!('result' in npaResult)) {
          const isKnownPackageManagerProtocol =
            PACKAGE_MANAGER_SPECIFIC_PROTOCOLS.some((protocol) =>
              spec.startsWith(`${protocol}:`),
            );
          if (!isKnownPackageManagerProtocol) {
            const protocolMatch = parseProtocol.exec(spec);
            if (allowNamedRegistries && protocolMatch) {
              // e.g. work:svgo@^1.0.0 -> svg0@^1.0.0
              const protocolPackageArg = protocolMatch[1];

              // Parse the portion right of the custom protocol to validate that.
              const protocolArgParseResult =
                parsePackageArg(protocolPackageArg);
              if (typeof protocolArgParseResult.error === 'string') {
                childResult.addIssue(
                  `invalid custom protocol arg for dependency \`${pkg}\`: ${protocolArgParseResult.error || protocolPackageArg}`,
                );
              }
            }
            // Ignore parsing errors from version using one of the known package manager protocols
            else {
              childResult.addIssue(
                `invalid version spec for dependency \`${pkg}\`: ${npaResult.error || spec}`,
              );
            }
          }
        }
      } else {
        childResult.addIssue(
          `dependency version for \`${pkg}\` should be a string: ${spec}`,
        );
      }
    }
  } else {
    const valueType = Array.isArray(value) ? 'array' : typeof value;
    result.addIssue(`the type should be \`object\`, not \`${valueType}\``);
  }

  return result;
};
