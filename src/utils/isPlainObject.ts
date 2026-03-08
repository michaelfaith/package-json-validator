/**
 * Type guard, checking if a value is a plain object (not an array, not null).
 */
export const isPlainObject = (
	value: unknown,
): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};
