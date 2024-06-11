import * as vscode from 'vscode';
import { codeLenRegExp, getLangMap, getLineTargetCode } from './utils';

export const languages = ['javascript', 'typescript', 'vue', 'javascriptreact', 'typescriptreact'];
export default function CodeLens(context: vscode.ExtensionContext) {
  let codelenDisposable: vscode.Disposable | null;
  const disposable = vscode.commands.registerCommand('languagecodeformat.codeLen', () => {
    if (codelenDisposable) return vscode.commands.executeCommand('languagecodeformat.codeLen.refresh');
    codelenDisposable = vscode.languages.registerInlayHintsProvider(languages, {
      provideInlayHints(document, range) {
        const lMap = getLangMap(context);
        if (!lMap || !lMap.size) return;
        let inlayHints: vscode.InlayHint[] = [];
        for (let i = range.start.line; i < range.end.line; i++) {
          let line = document.lineAt(i);
          /** 排除空白行 */
          if (line.isEmptyOrWhitespace) continue;
          const targetCodes = getLineTargetCode(line.text);
          const txtPositionInLine = targetCodes.flatMap((i => {
            const txtIndexInLine = line.text.indexOf(i);
            if (txtIndexInLine < 0) return [];
            return {
              code: i,
              position: new vscode.Position(line.lineNumber, txtIndexInLine)
            };
          }));
          const getCurrentModeLabel = (code: string) => {
            const codeLenMode = vscode.workspace.getConfiguration('languagecodeformat')?.get<number>('codeLenMode') || 0;
            const texts = lMap.get(code) || [];
            const value = texts?.[codeLenMode] as string;
            const tooltip = new vscode.MarkdownString(texts.flatMap((i,k) => 
              i ? `[\`${i}\`](command:languagecodeformat.codeLen.setMode?${encodeURIComponent(k)})` : []).join(' | '))
            tooltip.isTrusted = true;
            const labelPart = new vscode.InlayHintLabelPart(` ${value} `);
            labelPart.tooltip = tooltip;
            return [labelPart];
          };
          txtPositionInLine.forEach(({ code, position }) => {
            if (!position) return;
            const currentRange = document.getWordRangeAtPosition(position, codeLenRegExp);
            if (!currentRange) return;
            inlayHints.push({
              /** 将文本插入到括号内 */
              label: getCurrentModeLabel(code),
              position: currentRange.with(undefined, new vscode.Position(position.line, currentRange.end.character)).end,
              kind: vscode.InlayHintKind.Type,
            });
          }, [] as vscode.InlayHint[]);
        }
        return inlayHints;
      }
    })
    context.subscriptions.push(codelenDisposable);
  });
  const refreshDisposable = vscode.commands.registerCommand('languagecodeformat.codeLen.refresh', () => {
    if (!codelenDisposable) return;
    codelenDisposable?.dispose();
    codelenDisposable = null;
    setTimeout(() => {
      vscode.commands.executeCommand('languagecodeformat.codeLen');
    }, 500)
  })
  const closeDisposable = vscode.commands.registerCommand('languagecodeformat.codeLen.close', () => {
    if (!codelenDisposable) return;
    codelenDisposable?.dispose();
    codelenDisposable = null;
  });
  const setModeDisposeable = vscode.commands.registerCommand('languagecodeformat.codeLen.setMode', (codelenMode:number)=> {
    const codeLenModeConfig = vscode.workspace.getConfiguration('languagecodeformat');
    codeLenModeConfig.update('codeLenMode', codelenMode);
    vscode.commands.executeCommand('languagecodeformat.codeLen.refresh');
  });
  return [disposable, closeDisposable, refreshDisposable, setModeDisposeable];
}