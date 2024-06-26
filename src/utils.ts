import * as vscode from 'vscode';

export type LanguageMap = Map<string, string[]>;
type LanguageMapArr = [string, string[]][];
export type NotEmpty<T> = T extends undefined ? never : T;

export type ExportJSONData = Record<string, Record<string, string>>;

/** 第一个是code  */
export type ExportJSONData2 = {
    data: string[]
};

export const UNIQUE_ID = 'langeuagecodeformat.idCount';
export const LANG_MAP = 'langeuagecodeformat.map';

export const getLangMap = (context: vscode.ExtensionContext) => {
    const langState = context.workspaceState.get<LanguageMapArr>(LANG_MAP);
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
    context.workspaceState.update(LANG_MAP, langMapArr);
}
export const langMapInit = (context: vscode.ExtensionContext) => context.workspaceState.update(LANG_MAP, [])


export function getCodeId(context: vscode.ExtensionContext, targetCount?: number): [string, number] {
    let count = targetCount || context.workspaceState.get<number>(UNIQUE_ID);
    if (!count) {
        count = 1;
        // context.workspaceState.update(UNIQUE_ID, count);
    } else {
        count++;
    }
    let languageIdMap = getLangMap(context);
    const key = codeIdTpl(count);
    if (languageIdMap?.has(key)) return getCodeId(context, count);
    return [key, count];
}

export function codeIdTpl(id: number) {
    return `ZKLANG${id.toString().padStart(8, '0')}`;
}
export function getLineTargetCode(lineText: string) {
    const result = lineText.match(codeLenRegExp);
    if (result) return result;
    return [] as string[];
}
export const codeLenRegExp = new RegExp('ZKLANG\\d{8}', 'g');