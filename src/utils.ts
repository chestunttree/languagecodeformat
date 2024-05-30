import * as vscode from 'vscode';

export type LanguageMap = Map<string, string[]>;
type LanguageMapArr = [string, string[]][];
export type NotEmpty<T> = T extends undefined ? never : T;

export const UNIQUE_ID = 'langeuagecodeformat.idCount';
export const LANG_MAP = 'langeuagecodeformat.map';

export const getLangMap = (context: vscode.ExtensionContext) => {
    const langState = context.globalState.get<LanguageMapArr>(LANG_MAP);
    if (langState) {
        if (langState instanceof Array) {
            return new Map(langState);
        } else {
            return undefined;
        }
    }
    return langState;
};
export const setLangMap = (langMap: LanguageMap, context: vscode.ExtensionContext) => {
    const langMapArr = Array.from(langMap);
    context.globalState.update(LANG_MAP, langMapArr);
}
export const langMapInit = (context: vscode.ExtensionContext) => context.globalState.update(LANG_MAP, [])