import * as vscode from 'vscode';
import langDB from './langDB';
import { LANG_MAP, LanguageMap, UNIQUE_ID, getLangMap, langMapInit, setLangMap } from './utils';



export function activate(context: vscode.ExtensionContext) {

	const codeMap = getLangMap(context);
	if (!codeMap) langMapInit(context);
	let disposable = vscode.commands.registerCommand('languagecodeformat.replace', async () => {
		console.log(context.globalState.get(UNIQUE_ID))

		vscode.window.showInformationMessage('Hello World from languageCodeFormat!');
		const editor = vscode.window.activeTextEditor;
		const select = editor?.selection;
		const document = editor?.document;
		const originText = document?.getText(select);
		console.log(select, document);
		if (!select || !document || !originText) return;
		let [newCodeId, newCodeCount] = getCodeId();
		const langMap = getLangMap(context);
		if (!langMap) return;
		let likeCodePicks: vscode.QuickPickItem[] = [];
		langMap.forEach((item, key) => {
			if (item.includes(originText)) {
				likeCodePicks.push({
					label: key,
					detail: item[0],
					description: item[1]
				});
			}
		});
		if (likeCodePicks.length) {
			let pick = await vscode.window.showQuickPick<vscode.QuickPickItem>(likeCodePicks);
			if (pick) newCodeId = pick.label;
		}

		editor.edit((editBuilder) => {
			editBuilder.replace(select, newCodeId);
			if (likeCodePicks.length) return;
			langMap.set(newCodeId, [originText]);
			setLangMap(langMap, context);
			context.globalState.update(UNIQUE_ID, newCodeCount);
		})
	});
	let disposable2 = langDB(context);
	let disposable3 = vscode.commands.registerCommand('languagecodeformat.clear', async () => {
		langMapInit(context);
		context.globalState.update(UNIQUE_ID, undefined);
	});
	vscode.window.setStatusBarMessage('插件启动')
	context.subscriptions.push(disposable, disposable2, disposable3);

	function getCodeId(targetCount?: number): [string, number] {
		let count = targetCount || context.globalState.get<number>(UNIQUE_ID);
		if (!count) {
			count = 1;
			// context.globalState.update(UNIQUE_ID, count);
		} else {
			count++;
		}
		let languageIdMap = getLangMap(context);
		const key = codeIdTpl(count);
		if (languageIdMap?.has(key)) return getCodeId(count);
		return [key, count];
	}
}
function codeIdTpl(id: number) {
	return `ZKLANG${id.toString().padStart(8, '0')}`;
}
export function deactivate() { }


