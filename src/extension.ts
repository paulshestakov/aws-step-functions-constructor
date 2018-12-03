import * as vscode from "vscode";
import parse from "./parser";
import visualize from "./visualizer";
import logger from "./logger";
import {getFileFormat} from './parse/file'

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.displaySF",
    () => {
      const activeFilePath = vscode.window.activeTextEditor!.document.uri
        .fsPath;

      const fileName = activeFilePath.split(/\/|\\/).reverse()[0];

      const panel = vscode.window.createWebviewPanel(
        fileName,
        fileName,
        vscode.ViewColumn.One,
        {}
      );
      panel.webview.html = getLoadingView();


      const fileFormat = getFileFormat(activeFilePath)


      parse(activeFilePath, (error: any, result: any) => {
        if (error) {
          logger.log(error);
        }
        const { startStep, steps } = result;

        visualize({ startStep, steps }, (err: any, res: any) => {
          if (err) {
            logger.log(err);
          }
          panel.webview.html = getWebviewContent(res);
        });
      });
    }
  );

  context.subscriptions.push(disposable);
}

function getWebviewContent(res: any) {
  return wrapInHtml(res);
}

function getLoadingView() {
  return wrapInHtml(`
  <style>
    .gooey {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 142px;
      height: 40px;
      margin: -20px 0 0 -71px;
      background: #fff;
      filter: contrast(20);
    }
    .gooey .dot {
      position: absolute;
      width: 16px;
      height: 16px;
      top: 12px;
      left: 15px;
      filter: blur(4px);
      background: #000;
      border-radius: 50%;
      transform: translateX(0);
      animation: dot 2.8s infinite;
    }
    .gooey .dots {
      transform: translateX(0);
      margin-top: 12px;
      margin-left: 31px;
      animation: dots 2.8s infinite;
    }
    .gooey .dots span {
      display: block;
      float: left;
      width: 16px;
      height: 16px;
      margin-left: 16px;
      filter: blur(4px);
      background: #000;
      border-radius: 50%;
    }
    @-moz-keyframes dot {
      50% {
        transform: translateX(96px);
      }
    }
    @-webkit-keyframes dot {
      50% {
        transform: translateX(96px);
      }
    }
    @-o-keyframes dot {
      50% {
        transform: translateX(96px);
      }
    }
    @keyframes dot {
      50% {
        transform: translateX(96px);
      }
    }
    @-moz-keyframes dots {
      50% {
        transform: translateX(-31px);
      }
    }
    @-webkit-keyframes dots {
      50% {
        transform: translateX(-31px);
      }
    }
    @-o-keyframes dots {
      50% {
        transform: translateX(-31px);
      }
    }
    @keyframes dots {
      50% {
        transform: translateX(-31px);
      }
    }
  </style>
  <div class="gooey">
    <span class="dot"></span>
    <div class="dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
  `);
}

function wrapInHtml(content: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <style>
      body {
        width: 100vh;
        height: 100vw;
        max-width: 100vw;
        max-height: 100vh;
        background-color: white;
      }
    </style>
    <body>
       ${content}
    </body>
    </html>
  `;
}

// this method is called when your extension is deactivated
export function deactivate() {}
