import { describe, expect, it, test } from 'vitest';

import { validate } from './validate.ts';

const getPackageJson = (
  extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
  config: {
    debug: true,
  },
  contributors: [{ name: 'Efrim Manuel Menuck' }],
  cpu: ['x64', 'ia32'],
  directories: {
    bin: 'dist/bin',
  },
  exports: {
    '.': './index.js',
  },
  files: ['dist', 'CHANGELOG.md'],
  main: 'index.js',
  man: ['./man/foo.1', './man/bar.1'],
  name: 'test-package',
  os: ['win32'],
  publishConfig: {
    access: 'public',
    provenance: true,
  },
  scripts: {
    lint: 'eslint .',
  },
  sideEffects: false,
  type: 'module',
  version: '0.5.0',
  workspaces: ['./packages/*'],
  ...extra,
});

const baseFields = {
  author: 'Nick Sullivan <nick@sullivanflock.com>',
  bugs: 'http://example.com/bugs',
  description: 'This is my description',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'git@github.com:michaelfaith/package-json-validator.git',
  },
};

// eslint-disable-next-line @typescript-eslint/no-deprecated
describe(validate, () => {
  test('Field formats', () => {
    expect(
      validate(getPackageJson({ bin: './path/to/program' })).errorMessages,
    ).toHaveLength(0);
    expect(
      validate(getPackageJson({ bin: { 'my-project': './path/to/program' } }))
        .errorMessages,
    ).toHaveLength(0);
    expect(
      validate(getPackageJson({ bin: ['./path/to/program'] })).errorMessages,
    ).toHaveLength(1);
    expect(
      validate(getPackageJson({ dependencies: { bad: { version: '3.3.3' } } }))
        .errorMessages,
    ).toHaveLength(1);
  });

  describe('with string input', () => {
    describe('Dependencies Ranges', () => {
      test('Smoke', () => {
        const json = getPackageJson({
          dependencies: {
            'caret-first': '^1.0.0',
            'caret-top': '^1',
            'catalog-named-package': 'catalog:react19',
            'catalog-package': 'catalog:',
            empty: '',
            star: '*',
            'svgo-v1': 'npm:svgo@1.3.2',
            'svgo-v2': 'npm:svgo@2.0.3',
            'tilde-first': '~1.2',
            'tilde-top': '~1',
            url: 'https://github.com/michaelfaith/package-json-validator',
            'workspace-gt-version': 'workspace:>1.2.3',
            'workspace-package-any': 'workspace:*',
            'workspace-package-caret': 'workspace:^',
            'workspace-package-no-range': 'workspace:',
            'workspace-package-tilde-version': 'workspace:~1.2.3',
            'workspace-pre-release': 'workspace:1.2.3-rc.1',
            'x-version': '1.2.x',
          },
          devDependencies: {
            gt: '>1.2.3',
            gteq: '>=1.2.3',
            lt: '<1.2.3',
            lteq: '<=1.2.3',
            range: '1.2.3 - 2.3.4',
            'verion-build': '1.2.3+build2012',
          },
          peerDependencies: {
            gt: '>1.2.3',
            gteq: '>=1.2.3',
            lt: '<1.2.3',
            lteq: '<=1.2.3',
            range: '1.2.3 - 2.3.4',
            'verion-build': '1.2.3+build2012',
          },
        });
        const result = validate(JSON.stringify(json));
        expect(result.errorMessages).toHaveLength(0);
      });

      it('reports a complaint when devDependencies has an invalid range', () => {
        const json = getPackageJson({
          devDependencies: {
            'bad-catalog': 'catalob:',
            'bad-npm': 'npm;svgo@^1.2.3',
            'package-name': 'abc123',
          },
        });

        const result = validate(JSON.stringify(json));

        expect(result.errorMessages).toEqual([
          'invalid version spec for dependency `bad-catalog`: Unsupported URL Type "catalob:": catalob:',
          'invalid version spec for dependency `bad-npm`: tags may not have any characters that encodeURIComponent encodes',
        ]);
      });

      it('reports a complaint when peerDependencies has an invalid range', () => {
        const json = getPackageJson({
          peerDependencies: {
            'package-name': 'jsr;',
          },
        });

        const result = validate(JSON.stringify(json));

        expect(result.errorMessages).toEqual([
          'invalid version spec for dependency `package-name`: tags may not have any characters that encodeURIComponent encodes',
        ]);
      });

      test('Dependencies with scope', () => {
        // reference: https://github.com/michaelfaith/package-json-validator/issues/49
        const json = getPackageJson({
          dependencies: {
            '@reactivex/rxjs': '^5.0.0-alpha.7',
            empty: '',
            star: '*',
            url: 'https://github.com/michaelfaith/package-json-validator',
          },
        });
        const result = validate(JSON.stringify(json));
        expect(result.errorMessages).toHaveLength(0);
      });
    });

    test('Required fields', () => {
      let json = getPackageJson();
      let result = validate(JSON.stringify(json));
      expect(result.errorMessages).toHaveLength(0);

      ['name', 'version'].forEach((field) => {
        json = getPackageJson();
        delete json[field];
        result = validate(JSON.stringify(json));
        expect(result.errorMessages).toEqual([
          `Missing required property: ${field}`,
        ]);
      });
    });
  });
  describe('with object input', () => {
    describe('Dependencies Ranges', () => {
      test('Smoke', () => {
        const json = getPackageJson({
          bundledDependencies: ['dep1', 'dep2'],
          bundleDependencies: true,
          dependencies: {
            'caret-first': '^1.0.0',
            'caret-top': '^1',
            'catalog-named-package': 'catalog:react19',
            'catalog-package': 'catalog:',
            empty: '',
            star: '*',
            'svgo-v1': 'npm:svgo@1.3.2',
            'svgo-v2': 'npm:svgo@2.0.3',
            'tilde-first': '~1.2',
            'tilde-top': '~1',
            url: 'https://github.com/michaelfaith/package-json-validator',
            'workspace-gt-version': 'workspace:>1.2.3',
            'workspace-package-any': 'workspace:*',
            'workspace-package-caret': 'workspace:^',
            'workspace-package-no-range': 'workspace:',
            'workspace-package-tilde-version': 'workspace:~1.2.3',
            'workspace-pre-release': 'workspace:1.2.3-rc.1',
            'x-version': '1.2.x',
          },
          devDependencies: {
            gt: '>1.2.3',
            gteq: '>=1.2.3',
            lt: '<1.2.3',
            lteq: '<=1.2.3',
            range: '1.2.3 - 2.3.4',
            'verion-build': '1.2.3+build2012',
          },
          optionalDependencies: {
            gt: '>1.2.3',
            gteq: '>=1.2.3',
            lt: '<1.2.3',
            lteq: '<=1.2.3',
            range: '1.2.3 - 2.3.4',
            'verion-build': '1.2.3+build2012',
          },
          peerDependencies: {
            gt: '>1.2.3',
            gteq: '>=1.2.3',
            lt: '<1.2.3',
            lteq: '<=1.2.3',
            range: '1.2.3 - 2.3.4',
            'verion-build': '1.2.3+build2012',
          },
        });
        const result = validate(json);
        expect(result.errorMessages).toHaveLength(0);
      });

      it('reports errors when devDependencies have invalid ranges', () => {
        const json = getPackageJson({
          devDependencies: {
            'bad-catalog': 'catalob:',
            'bad-npm': 'npm;svgo@^1.2.3',
            'package-name': 'abc123',
          },
        });

        const result = validate(json);

        expect(result.errorMessages).toEqual([
          'invalid version spec for dependency `bad-catalog`: Unsupported URL Type "catalob:": catalob:',
          'invalid version spec for dependency `bad-npm`: tags may not have any characters that encodeURIComponent encodes',
        ]);
      });

      it('reports a complaint when peerDependencies has an invalid range', () => {
        const json = getPackageJson({
          peerDependencies: {
            'package-name': 'jsr;',
          },
        });

        const result = validate(json);

        expect(result.errorMessages).toEqual([
          'invalid version spec for dependency `package-name`: tags may not have any characters that encodeURIComponent encodes',
        ]);
      });

      test('Dependencies with scope', () => {
        // reference: https://github.com/michaelfaith/package-json-validator/issues/49
        const json = getPackageJson({
          dependencies: {
            '@reactivex/rxjs': '^5.0.0-alpha.7',
            empty: '',
            star: '*',
            url: 'https://github.com/michaelfaith/package-json-validator',
          },
        });
        expect(validate(json).errorMessages).toHaveLength(0);
      });
    });

    test('Required fields', () => {
      let json = getPackageJson();
      let result = validate(json);
      expect(result.errorMessages).toHaveLength(0);

      ['name', 'version'].forEach((field) => {
        json = getPackageJson();
        delete json[field];
        result = validate(json);
        expect(result.errorMessages).toEqual([
          `Missing required property: ${field}`,
        ]);
      });
    });

    test('Licenses', () => {
      const json = getPackageJson(baseFields);
      const result = validate(json);
      expect(result.errorMessages).toHaveLength(0);
    });
  });

  it('should throw for invalid JSON string input', () => {
    expect(() => validate('invalid')).toThrow('Invalid JSON');
  });

  it('should throw for invalid type using string input (array)', () => {
    expect(() => validate('[]')).toThrow(
      'JSON string has invalid type. It should be an object.',
    );
  });

  it('should throw for invalid input type', () => {
    expect(() => validate(123 as unknown as string)).toThrow(
      'Invalid data: Input should be a string or an object',
    );
  });

  it('should return a successful Result for valid package data', () => {
    const result = validate(getPackageJson());

    expect(result.issues).toHaveLength(0);
    expect(result.errorMessages).toEqual([]);
    expect(result.childResults.length).toBeGreaterThan(0);
  });

  it('should report a missing required field as an issue', () => {
    const json = getPackageJson();
    delete json.name;

    const result = validate(json);

    expect(result.issues).toHaveLength(1);
    expect(result.errorMessages).toEqual(['Missing required property: name']);
  });

  it('should include nested validation issues in errorMessages', () => {
    const json = getPackageJson({
      devDependencies: {
        'package-name': '>-1.0.0',
      },
    });

    const result = validate(json);

    expect(result.issues).toHaveLength(0);
    expect(result.errorMessages).toContain(
      'invalid version spec for dependency `package-name`: tags may not have any characters that encodeURIComponent encodes',
    );
    expect(
      result.childResults.some((child) =>
        child.errorMessages.includes(
          'invalid version spec for dependency `package-name`: tags may not have any characters that encodeURIComponent encodes',
        ),
      ),
    ).toBe(true);
  });
});
