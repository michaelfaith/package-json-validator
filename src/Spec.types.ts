import type { Result } from "./Result.ts";

export type SpecMap = Record<string, FieldSpec>;

interface FieldSpec {
	recommended?: boolean;
	required?: boolean;
	validate: (value: unknown) => Result;
	warning?: boolean;
}
