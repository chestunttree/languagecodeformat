import * as vscode from 'vscode';
import { getLangMap } from './utils';

export const languages = ['javascript', 'typescript', 'vue', 'javascriptreact', 'typescriptreact'];
export default function CodeLens(context: vscode.ExtensionContext) {
  let codelenDisposable: vscode.Disposable | null;
  const disposable = vscode.commands.registerCommand('languagecodeformat.codeLen', () => {
    codelenDisposable = vscode.languages.registerInlayHintsProvider(languages, {
      provideInlayHints(document, range) {
        const lMap = getLangMap(context);
        if (!lMap || !lMap.size) return;
        const allCode: string[] = []
        lMap.forEach((_, k) => allCode.push(k));
        for (let i = range.start.line; i < range.end.line; i++) {
          let line = document.lineAt(i);
          /** 排除空白行 */
          if (line.isEmptyOrWhitespace) continue;
          const codePosition = allCode.map((i) => {
            const txtIndexInLine = line.text.indexOf(i);
            if (txtIndexInLine < 0) return undefined;
            return new vscode.Position(line.lineNumber, txtIndexInLine);
          });
          // codePosition.reduce((result, p)=>{
          //   if(!p) return;
          //   const currentRange = document.getWordRangeAtPosition(p, );
          //   if (!currentRange) return result;
          //   return [...result, {
          //     /** 将文本插入到括号内 */
          //     range: currentRange.with(undefined, new vscode.Position(p.line, currentRange.end.character-1)),
          //     text: lMap.get()
          //   }];
          // }, [])
        }
        return [];
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
  })
  return [disposable, closeDisposable, refreshDisposable];
}