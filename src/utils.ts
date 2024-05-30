export type LanguageMap = Map<string, string[]>;
export type NotEmpty<T> = T extends undefined ? never : T;

export const UNIQUE_ID = 'langeuagecodeformat.idCount';
export const LANG_MAP = 'langeuagecodeformat.map';