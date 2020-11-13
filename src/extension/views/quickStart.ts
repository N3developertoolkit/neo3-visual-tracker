import * as vscode from "vscode";

export default class QuickStart implements vscode.WebviewViewProvider {
  private webviewView: vscode.WebviewView | null;

  constructor() {
    this.webviewView = null;
  }

  dispose() {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.webviewView = webviewView;
    this.webviewView.webview.html = "Hello world!";
  }
}
