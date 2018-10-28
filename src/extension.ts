import * as vscode from 'vscode';
import { cmdFormatter, formatter } from './formatter';

export function activate(context: vscode.ExtensionContext) {


    const conf = vscode.workspace.getConfiguration('HeadCommaJson');
    if (conf.get('registerAsFormatter') === true) {
        // 注册全文格式化服务
        context.subscriptions.push(
            vscode.languages.registerDocumentFormattingEditProvider(
                'json', {
                    provideDocumentFormattingEdits: (document, options, token) => {
                        let lastLine = document.lineCount - 1;
                        lastLine = lastLine > 0 ? lastLine : 0;
                        let lastChar = document.lineAt(lastLine).text.length - 1;
                        lastChar = lastChar > 0 ? lastChar : 0;
                        const range: vscode.Range = new vscode.Range(0, 0, lastLine, lastChar);
                        return formatter(document, range, options);
                    }
                })
        );

        // 注册选区格式化服务
        context.subscriptions.push(
            vscode.languages.registerDocumentRangeFormattingEditProvider(
                'json', {
                    provideDocumentRangeFormattingEdits: (document, range: vscode.Range, options, token) => {
                        return formatter(document, range, options);
                    }
                })
        );
    }


    let disposable = vscode.commands.registerCommand('extension.headCommaJson', cmdFormatter);

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}