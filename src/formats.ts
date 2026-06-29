export const emailFormat: RegExp = /\S+@\S+/; // I know this isn't thorough. it's not supposed to be.
export const packageFormat: RegExp = /^[a-z0-9@/][\w@/.-]*$/i;
export const urlFormat: RegExp = /^https?:\/\/[a-z.\-0-9]+/;
export const versionFormat: RegExp = /^\d+\.\d[0-9+a-z.-]+$/i;
