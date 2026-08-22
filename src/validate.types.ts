import type { Result } from './Result.ts';

export type ValidateFunction = (value: unknown) => Result;

export type PropertyValidations = Record<
  string,
  ValidationOptions | ValidateFunction
>;

interface ValidationOptions {
  required: boolean;
  validate: ValidateFunction;
}
