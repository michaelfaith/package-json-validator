export type SpecMap = Record<string, FieldSpec>;

interface FieldSpec {
	recommended?: boolean;
	required?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	validate: (name: string, obj: any) => string[];
	warning?: boolean;
}
