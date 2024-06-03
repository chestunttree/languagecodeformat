import * as vscode from 'vscode';
import langDB from './langDB';
import { LANG_MAP, LanguageMap, UNIQUE_ID, getCodeId, getLangMap, langMapInit, setLangMap } from './utils';


const codeIdTplRegExp = new RegExp('%code%', 'g');
export function activate(context: vscode.ExtensionContext) {

	const codeMap = getLangMap(context);
	if (!codeMap) langMapInit(context);

	let disposable = vscode.commands.registerCommand('languagecodeformat.replace', async () => {
		console.log(context.globalState.get(UNIQUE_ID))
		vscode.window.showInformationMessage('Hello World from languageCodeFormat!');
		const codeTpl = getReplaceTpl();
		const editor = vscode.window.activeTextEditor;
		const select = editor?.selection;
		const document = editor?.document;
		const originText = document?.getText(select);
		if (!select || !document || !originText) return;
		let [newCodeId, newCodeCount] = getCodeId(context);
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
		let selectCodeId: string | undefined;
		if (likeCodePicks.length) {
			const createNewCodeIdPick: vscode.QuickPickItem = { label: 'create a new item', iconPath: new vscode.ThemeIcon('add') };
			const divider: vscode.QuickPickItem = { label: '', kind: vscode.QuickPickItemKind.Separator };
			let pick = await vscode.window.showQuickPick<vscode.QuickPickItem>([
				...likeCodePicks,
				divider,
				createNewCodeIdPick
			]);
			/** 未选代表不改了 */
			if (!pick) return;
			selectCodeId = pick.label !== 'create a new item' ? pick.label : undefined;
			if (selectCodeId) {
				newCodeId = selectCodeId;
			}
		}
		editor.edit((editBuilder) => {
			editBuilder.replace(select, 
				/** 判断使用替换模板 */
				codeTpl ? codeTpl.replace(codeIdTplRegExp, newCodeId) : newCodeId
			);
			if (selectCodeId) return;
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
	vscode.window.setStatusBarMessage('插件启动');
	context.subscriptions.push(disposable, disposable2, disposable3);

}
function getReplaceTpl() {
	const config = vscode.workspace.getConfiguration('languagecodeformat');
	return config.get<string>('replaceTpl');
};

export function deactivate() { }


