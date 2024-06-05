import * as vscode from 'vscode';
import langDB from './langDB';
import { LANG_MAP, LanguageMap, UNIQUE_ID, getCodeId, getLangMap, langMapInit, setLangMap } from './utils';
import CodeLens from './codeLens';


const codeIdTplRegExp = new RegExp('%code%', 'g');
export function activate(context: vscode.ExtensionContext) {

	const codeMap = getLangMap(context);
	if (!codeMap) langMapInit(context);

	let disposable = vscode.commands.registerCommand('languagecodeformat.replace', async () => {
		console.log(context.workspaceState.get(UNIQUE_ID))
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
		let likeCodeAboutPicks: vscode.QuickPickItem[] = [];
		langMap.forEach((item, key) => {
			if (item.includes(originText)) {
				likeCodePicks.push({
					label: key,
					detail: item[0],
					description: item[1]
				});
			}else if(item.find(i=>i.includes(originText))){
				likeCodeAboutPicks.push({
					label: key,
					detail: item[0],
					description: item[1]
				});
			}
		});
		let selectCodeId: string | undefined;
		if (likeCodePicks.length || likeCodeAboutPicks.length) {
			const createNewCodeIdPick: vscode.QuickPickItem = { label: 'create a new item', iconPath: new vscode.ThemeIcon('add') };
			const divider:(label?:string) => vscode.QuickPickItem = (label='') => ({ label, kind: vscode.QuickPickItemKind.Separator });
			let pick = await vscode.window.showQuickPick<vscode.QuickPickItem>([
				...likeCodePicks,
				divider('类似的'),
				...likeCodeAboutPicks,
				divider(),
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
			context.workspaceState.update(UNIQUE_ID, newCodeCount);
		})
	});
	let disposable2 = langDB(context);
	let disposable3 = vscode.commands.registerCommand('languagecodeformat.clear', async () => {
		langMapInit(context);
		context.workspaceState.update(UNIQUE_ID, undefined);
	});
	let disposable4 = vscode.commands.registerCommand('languagecodeformat.setCount', async () => {
		const countId = context.workspaceState.get<number>(UNIQUE_ID);
		const newCoundId = await vscode.window.showInputBox({
			title: '当前自增ID设置',
			value: String(countId)
		});
		if(newCoundId && !Number.isNaN(Number(newCoundId))) {
			context.workspaceState.update(UNIQUE_ID, newCoundId);
		}
	});
	vscode.window.setStatusBarMessage('插件启动', 3000);
	context.subscriptions.push(disposable, disposable2, disposable3, disposable4, ...CodeLens(context));

}
function getReplaceTpl() {
	const config = vscode.workspace.getConfiguration('languagecodeformat');
	return config.get<string>('replaceTpl');
};

export function deactivate() { }


