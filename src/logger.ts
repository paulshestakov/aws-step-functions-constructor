import * as vscode from "vscode";

class Logger {
  log(data: any) {
    vscode.window.showInformationMessage(JSON.stringify(data));
  }
}

export default new Logger();
