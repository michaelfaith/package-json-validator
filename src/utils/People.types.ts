export type People = Person | Person[] | string;

export interface Person {
	email?: string;
	name: string;
	url?: string;
	web?: string;
}
