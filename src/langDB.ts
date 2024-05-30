import * as vscode from 'vscode';
import { LANG_MAP, LanguageMap, UNIQUE_ID } from './utils';

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
const mockData = [
  {
    "id": 15000020040427514,
    "languageCode": "lrhpijicu",
    "languageName": "他斯千各易系能酸车西群日主应产马。",
    "languageldentifiers": "Bdb Cgtdeiu Vqtrm Lbijffn Wmmbpim"
  },
  {
    "id": 120000201010267380,
    "languageCode": "jkrtwckpis",
    "languageName": "题加养置道约情红根比素口维要布反便。",
    "languageldentifiers": "Utcay Nlsov Ssdjd Przftvud Jsksbl"
  },
  {
    "id": 420000200004025660,
    "languageCode": "sttm",
    "languageName": "权史者展强连心次当则科选报目们。",
    "languageldentifiers": "Onkfyv Yyvd Oyrbnf Xwqjnfear Vsc"
  },
  {
    "id": 510000198705031400,
    "languageCode": "pcx",
    "languageName": "术安矿成斗红毛已行应流只象属结样根。",
    "languageldentifiers": "Fnubqkckc Flmjqp Dduaqq Xftutb Oqjv Qzfec"
  },
  {
    "id": 35000020211217444,
    "languageCode": "jjgcxbx",
    "languageName": "支如性米品之在须例义作统。",
    "languageldentifiers": "Auitdo Thbwb Baeb Yxtf"
  },
  {
    "id": 530000201603137860,
    "languageCode": "cujp",
    "languageName": "共第区六步设到照方边己求容火。",
    "languageldentifiers": "Xdujhzlt Xreo Kbawuzxsmb Ugimsgu"
  },
  {
    "id": 500000198905242700,
    "languageCode": "knlf",
    "languageName": "口王重候数志同干界出如周深使给。",
    "languageldentifiers": "Upjes Wjskukpsf Itquutdqh Mwsohu Ebwh"
  },
  {
    "id": 350000197410118900,
    "languageCode": "qmpv",
    "languageName": "电百便六领引照变各着重花采设层。",
    "languageldentifiers": "Upa Hterhqayx Sqxw Epxu Kxm"
  },
  {
    "id": 640000199207232600,
    "languageCode": "bofe",
    "languageName": "低人置定总数线广向般影图号军成。",
    "languageldentifiers": "Hvdeqtur Qkxmocgs Jlflloyo Hxquyyoec Dlidwtosq Mypmxt"
  },
  {
    "id": 330000197607115260,
    "languageCode": "sfttv",
    "languageName": "自走般亲口单较所当月体式展军。",
    "languageldentifiers": "Gnxnq Nunkzxx Wtzyuqayg Rmsdyclcu Iekgyb Emm Akle"
  }
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
    const mapData = context.globalState.get<LanguageMap>(LANG_MAP);
    const htmlTheme = `--bs-body-bg: ${bgColor};`;
    if(!mapData || !mapData.size) {
      panel.webview.html = getWebviewContent(`
        <div class="alert alert-dark" role="alert" style="margin: 30px 0;">
          暂无数据
        </div>
      `,  htmlTheme);
      return;
    };
    
    panel.webview.html = getWebviewContent(table(tbColumn, mockData, { bgColor, fontColor, borderColor, thFontColor }), htmlTheme);
    console.log(context.globalState.get(UNIQUE_ID), context.globalState.get(LANG_MAP))
  });

  function table(columns: TableColumn[], data: Record<string, any>[], theme: { bgColor: string, fontColor: string, borderColor: string, thFontColor: string }) {
    const themeColor = `--bs-border-color: ${theme.borderColor};--bs-table-color: ${theme.fontColor};`
    const header = columns.map(({ label }) => `<th scope="col">${label}</th>`);
    const body = data.map((item, index) => `<tr>
      <th scope="row"> ${index} </th>
      ${columns.map(({ prop }) => `<td> ${item[prop]} </td>`)
      }
    </tr>`);
    return (
      `<table class="table" style="${themeColor}">
        <thead>
          <tr>
            <th scope="col"># </th>
            ${header.join(' ')}
          </tr>
        </thead>
        <tbody>
          ${body.join(' ')}
        </tbody>
      </table>`
    );
  }
  function getWebviewContent(body: string, theme: string) {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cat Coding</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js" integrity="sha384-/mhDoLbDldZc3qpsJHpLogda//BVZbgYuw6kof4u2FrCedxOtgRZDTHgHUhOCVim" crossorigin="anonymous"></script>
        </head>
        <body style="${theme}">
            ${body}
        </body>
        </html>`;
  }
}