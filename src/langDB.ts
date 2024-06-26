import * as vscode from 'vscode';
import { ExportJSONData, ExportJSONData2, LANG_MAP, LanguageMap, UNIQUE_ID, getCodeId, getLangMap, setLangMap } from './utils';
import { readFileSync } from 'fs';

const tbColumn = [
  {
    label: 'First',
    prop: 'languageCode'
  },
  {
    label: 'Last',
    prop: 'languageName'
  },
  {
    label: 'Handle',
    prop: 'languageldentifiers'
  },
]
type TableColumn = (typeof tbColumn)[0];
export default function (context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand('languagecodeformat.db', async () => {
    const bgColor = '#1f1f1f';
    const fontColor = '#ababab';
    const thFontColor = '#dddddd';
    const borderColor = '#303030';
    const panel = vscode.window.createWebviewPanel(
      'languagecodeformat',
      'language map db',
      vscode.ViewColumn.One,
      {
        // 以下选项可以启用webview内容安全性策略
        enableScripts: true,

        // 当插件被重新加载时, webview会一并保留
        retainContextWhenHidden: true
      }
    );
    const htmlTheme = `--bs-body-bg: ${bgColor};`;
    function getTableOptions() {
      const mapData = getLangMap(context);
      if (!mapData || !mapData.size) return;
      let tbCol: Record<string, TableColumn> = {};
      let tbData: Record<string, string>[] = [];
      let maxCol = 2;
      mapData.forEach((item, key) => {
        tbData.push({
          code: key,
          ...item.reduce((r, i, k) => {
            if (k + 1 > maxCol) maxCol = k + 1;
            if (!tbCol[k]) tbCol[k] = { label: `column-${k + 1}`, prop: `column-${k + 1}` }
            return ({ ...r, [`column-${k + 1}`]: i })
          }, {} as Record<string, any>)
        });
      });
      let tCol = [{ label: 'code', prop: 'code' }, ...Object.values(tbCol)];
      const tColDiff = maxCol - tCol.length - 1;

      if (tColDiff > 0) {
        tCol = tCol.concat(new Array(tColDiff).fill(1).map((i, k) => ({
          label: `column-${k + tCol.length}`,
          prop: `column-${k + tCol.length}`,
        })));
      }
      return { tCol, tbData };
    }
    const tableOptions = getTableOptions();
    if (!tableOptions) {
      panel.webview.html = getWebviewContent(`
        <div>
          <div class="dropdown">
            <button type="button" type="button" data-bs-toggle="dropdown" aria-expanded="false" class="btn btn-sm btn-light dropdown-toggle">
              导入JSON
            </button>
            <ul class="dropdown-menu export-dorpdown-list">
              <li><a class="dropdown-item export-dropdown" export-type="1" href="javascript:;">解析i18n messagea 数据</a></li>
              <li><a class="dropdown-item export-dropdown" export-type="2" href="javascript:;">
                导入字典
                <div style="font-size: 12px;">[code: string，msg1: string，msg2: string, ...]</div>
              </a></li>
            </ul>
          </div>
          <div class="alert alert-dark" role="alert" style="margin: 30px 0;">
            暂无数据
          </div>
        </div>
      `, htmlTheme);
      return pageEvent();
    }
    panel.webview.html = getWebviewContent(table(tableOptions.tCol, tableOptions.tbData, { bgColor, fontColor, borderColor, thFontColor }), htmlTheme);
    pageEvent();
    function pageEvent() {
      const copyCodeMap = async (msg: any) => {
        const textToCopy = JSON.stringify(copyDataFormat(msg.copyIndex));
        await vscode.env.clipboard.writeText(textToCopy);
        vscode.window.showInformationMessage('已复制到剪切板')
      }
      const handleRefresh = () => {
        const tableOptions = getTableOptions();
        if (!tableOptions) {
          return panel.webview.html = getWebviewContent(`
            <div>
              <div class="dropdown">
                <button type="button" type="button" data-bs-toggle="dropdown" aria-expanded="false" class="btn btn-sm btn-light dropdown-toggle">
                  导入JSON
                </button>
                <ul class="dropdown-menu export-dorpdown-list">
                  <li><a class="dropdown-item export-dropdown" export-type="1" href="javascript:;">解析i18n messagea 数据</a></li>
                  <li><a class="dropdown-item export-dropdown" export-type="2" href="javascript:;">
                    导入字典
                    <div style="font-size: 12px;">[code: string，msg1: string，msg2: string, ...]</div>
                  </a></li>
                </ul>
              </div>
              <div class="alert alert-dark" role="alert" style="margin: 30px 0;">
                暂无数据
              </div>
            </div>
          `, htmlTheme);
        }
        panel.webview.html = getWebviewContent(table(tableOptions.tCol, tableOptions.tbData, { bgColor, fontColor, borderColor, thFontColor }), htmlTheme);
      }
      const handleColEditor = async (msg: any) => {
        const code = msg.code;
        const lMap = getLangMap(context);
        if (!lMap) return;
        const originVal = lMap?.get(code)
        if (!originVal) return;
        const result = await vscode.window.showInputBox({ value: originVal[0] });
        if (result && result !== originVal[0]) {
          originVal[0] = result;
          setLangMap(lMap, context);
          handleRefresh();
        }
      }
      const copyDataFormat = (copyIndex = 0) => {
        const res = getTableOptions();
        if (!res) return {};
        return res.tbData.reduce((r, { code, ...m }) => ({
          ...r,
          [code]: Object.values(m)[copyIndex]
        }), {});
      }
      const handleDelete = async (msg: any) => {
        const code = msg.code;
        const lMap = getLangMap(context);
        if (!lMap) return;
        const result = await vscode.window.showInformationMessage('确定删除? 你的代码我可不会改哦 -_- ', '必须的, 删!', '容我三思');
        if (result !== '必须的, 删!') return;
        lMap.delete(code);
        setLangMap(lMap, context);
        handleRefresh();
      }
      const handleExport = async (msg: any) => {
        const fileUris = await vscode.window.showOpenDialog({
          title: '选则要导入的JSON文件',
          filters: {
            Json: ["json"]
          }
        });
        if (!fileUris) return;
        const [{ fsPath }] = fileUris;
        const JsonStr = readFileSync(fsPath, 'utf-8');
        const lMap = getLangMap(context);
        if (!lMap) return;
        
        if (msg.exportType === '1') {
          /** 解析i18n messagea 数据解析i18n messagea 数据 */
          const jsonData: ExportJSONData = JSON.parse(JsonStr);
          Object.values(jsonData).forEach((modeItem, index, arr) => {
            Object.keys(modeItem).forEach((item) => {
              const target = lMap.get(item) || [];
              target.push(modeItem[item]);
              lMap.set(item, target);
            })
          })
        } else if (msg.exportType === '2') {
          /** 导入字典导入字典 */
          const jsonData: ExportJSONData2 = JSON.parse(JsonStr);
          jsonData.data.forEach((modeItem) => {
            const [code, ...msgs] = modeItem;
            /**　有就覆盖，没有就生成code */
            if (code) {
              lMap.set(code, msgs)
            } else {
              let [newCodeId, newCodeCount] = getCodeId(context);
              lMap.set(newCodeId, msgs);
              context.workspaceState.update(UNIQUE_ID, newCodeCount);
            }
          })
        }
        setLangMap(lMap, context);
        handleRefresh();
      };
      const handleShowSearch = async (msg: any) => {
        const search = await vscode.window.showInputBox({ title: 'Cell Search' });
        if (!search || !search.trim()) return;
        panel.webview.postMessage({ command: 'findCell', search });
      }

      panel.webview.onDidReceiveMessage(
        message => {
          if (message.command === 'copy') return copyCodeMap(message);
          if (message.command === 'refresh') return handleRefresh();
          if (message.command === 'colEditor') return handleColEditor(message);
          if (message.command === 'delete') return handleDelete(message);
          if (message.command === 'export') return handleExport(message);
          if (message.command === 'showSearch') return handleShowSearch(message);
        },
        undefined,
        context.subscriptions
      );
    }
  });

  function table(columns: TableColumn[], data: Record<string, any>[], theme: { bgColor: string, fontColor: string, borderColor: string, thFontColor: string }) {
    const themeColor = [
      `--bs-table-color: ${theme.fontColor};`,
      `--bs-body-color: ${theme.fontColor};`,
      `--bs-border-color: ${theme.borderColor};`,
    ].join('');
    const header = columns.map(({ label }, index) => `<th scope="col">${label} ${index > 0 ? `<a class="copy-item" copy-index="${index - 1}" href="javascript:;">${CopyIcon()}</a>` : ''
      }</th>`);
    const body = data.map((item, index) => `<tr>
      <th scope="row"> ${index} </th>
      ${columns.map(({ prop }) => `<td class="column-item">
          <div class="${prop}" code="${item.code}"> ${item[prop]} </div>
        </td>`)
      }
      <td><button id="delete" type="button" class="btn btn-sm btn-secondary" code="${item.code}">删除</button></td>
    </tr>`);
    //<button id="copy" class="btn btn-sm btn-secondary" >复制为JSON</button>
    return (`
      <div class="list-wrapper">
        <div class="space padding-10">
          <div class="dropdown">
            <button type="button" type="button" data-bs-toggle="dropdown" aria-expanded="false" class="btn btn-sm btn-secondary dropdown-toggle">
              导入JSON
            </button>
            <ul class="dropdown-menu export-dorpdown-list">
              <li><a class="dropdown-item export-dropdown" export-type="1" href="javascript:;">解析i18n messagea 数据</a></li>
              <li><a class="dropdown-item export-dropdown" export-type="2" href="javascript:;">
                导入字典
                <div style="font-size: 12px;">[code: string，msg1: string，msg2: string, ...]</div>
              </a></li>
            </ul>
          </div>
          <button id="refresh" type="button" class="btn btn-sm btn-secondary">
            <svg t="1717126758083" style="width:1em;height:1em;margin-top: -3px;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1670" width="200" height="200"><path d="M921.6 102.4c25.12213333 0 45.53386667 20.34346667 45.53386667 45.53386667V512a45.53386667 45.53386667 0 0 1-91.06773334 0V147.93386667c0-25.1904 20.41173333-45.53386667 45.53386667-45.53386667zM102.4 466.46613333c25.12213333 0 45.53386667 20.41173333 45.53386667 45.53386667v364.06613333a45.53386667 45.53386667 0 1 1-91.06773334 0V512c0-25.12213333 20.41173333-45.53386667 45.53386667-45.53386667z" fill="#ababab" p-id="1671"></path><path d="M184.5248 195.92533333A455.13386667 455.13386667 0 0 1 967.13386667 512a45.53386667 45.53386667 0 0 1-91.06773334 0 364.06613333 364.06613333 0 0 0-626.00533333-252.85973333 45.53386667 45.53386667 0 1 1-65.536-63.21493334zM102.4 466.46613333c25.12213333 0 45.53386667 20.41173333 45.53386667 45.53386667a364.06613333 364.06613333 0 0 0 616.92586666 262.00746667 45.53386667 45.53386667 0 0 1 63.21493334 65.46773333A455.13386667 455.13386667 0 0 1 56.9344 512c0-25.12213333 20.34346667-45.53386667 45.4656-45.53386667z" fill="#ababab" p-id="1672"></path></svg>
          </button>
          <button id="search" type="button" class="search-submit btn btn-sm btn-secondary">
            搜索
          </button>
        </div>
        <div class="export-list">
          <table class="table">
            <thead>
              <tr>
                <th scope="col"># </th>
                ${header.join(' ')}
                <th style="width:70px;">操作</th>
              </tr>
            </thead>
            <tbody>
              ${body.join(' ')}
            </tbody>
          </table>
        </div>
      </div>
      `
    );
  }
  function EventScript() {
    return `
      <script>
        $(function(){
          var vscode = acquireVsCodeApi();
          $(document).on('click', '.copy-item', function(e){
            vscode.postMessage({
                command: 'copy',
                text: 'copy to JSON',
                copyIndex: $(this).attr('copy-index')
            });
          });
          $(document).on('click', '.export-dropdown', function(e){
            var type = $(this).attr('export-type');
            vscode.postMessage({
                command: 'export',
                text: 'export data',
                exportType: type
            });
          });
          $(document).on('click', '#refresh', function(e){
            vscode.postMessage({
                command: 'refresh',
                text: 'refresh data'
            });
          });
          $(document).on('click', '.column-1', function(e){
            var code = $(this).attr('code');
            vscode.postMessage({
                command: 'colEditor',
                text: 'col editor',
                code,
            });
          });
          $(document).on('click', '#delete', function(e){
            var code = $(this).attr('code');
            vscode.postMessage({
                command: 'delete',
                text: 'col delete',
                code,
            });
          });
          $(document).on('click', '.search-submit', function(){
            
            vscode.postMessage({
                command: 'showSearch',
            });
          });
          $(document).on('click', '#search', function(){
            
            vscode.postMessage({
                command: 'showSearch',
            });
          });

          window.addEventListener('message', event => {
            var message = event.data; // The JSON data our extension sent
            if(message.command === 'findCell') {
              
              var table = $('table').find
            }
          });
        });
      </script>
    `;
  }

  function getWebviewContent(body: string, theme: string) {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
            <script src="http://libs.baidu.com/jquery/2.0.0/jquery.min.js"></script>
            <style>
              .table {
                min-width: 680px;
              }
              .space-between {
                display: flex;
                gap: 1em;
                justify-content: space-between;
                align-items: center;
              }
              .space {
                display: inline-flex;
                gap: 1em;
                align-items: center;
              }
              .padding-10 {
                padding: 10px;
              }
              .column-1 {
                cursor: pointer;
              }
              .column-1:hover {
                text-shadow: var(--bs-gray-200) 1px 0 10px;
              }
              td>div {
                width: 100%;
              }
              .list-wrapper {
                height: 100vh;
                display: flex;
                flex-direction: column;
              }
              .list-wrapper .export-list {
                flex: 1;
                overflow: hidden auto;
              }
              .list-wrapper .form-control {
                background-color: transparent;
              }
            </style>
          </head>
        <body style="${theme}" data-bs-theme="dark" >
            ${body}
            ${EventScript()}
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>`;
  }
  function CopyIcon() {
    return `
      <svg t="1717417569103" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2492" width="1em" height="1em">
        <path d="M263.2 761.3H145.4c-45.5 0-82.5-37-82.5-82.5V150.6c0-45.5 37-82.5 82.5-82.5h488.9c45.5 0 82.5 37 82.5 82.5v70.1c0 11-9 20-20 20s-20-9-20-20v-70.1c0-23.4-19-42.5-42.5-42.5H145.4c-23.4 0-42.5 19-42.5 42.5v528.3c0 23.4 19 42.5 42.5 42.5h117.8c11 0 20 9 20 20s-8.9 19.9-20 19.9z" fill="#ababab" p-id="2493"></path>
        <path d="M897.2 971.1H400.9c-42.5 0-77.2-34.6-77.2-77.2V358.4c0-42.5 34.6-77.2 77.2-77.2h496.4c42.5 0 77.2 34.6 77.2 77.2V894c-0.1 42.5-34.7 77.1-77.3 77.1zM400.9 321.2c-20.5 0-37.2 16.7-37.2 37.2V894c0 20.5 16.7 37.2 37.2 37.2h496.4c20.5 0 37.2-16.7 37.2-37.2V358.4c0-20.5-16.7-37.2-37.2-37.2H400.9z" fill="#ababab" p-id="2494"></path>
      </svg>
    `
  }
}
