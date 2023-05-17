import * as vscode from 'vscode'
import { TodoDataProvider } from './todoModel'

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (workspaceFolders) {
    const projectPath = workspaceFolders[0].uri.fsPath
    const todoDataProvider = new TodoDataProvider(context, projectPath)
    context.subscriptions.push(vscode.window.registerTreeDataProvider('vscode-scripts.id', todoDataProvider))
    context.subscriptions.push(vscode.commands.registerCommand('vscode-scripts.run', async (script) => {
      debugger
      const terminal = vscode.window.createTerminal('Terminal')
      terminal.show()
      terminal.sendText('echo "hi"')
    }))
  }
}

export function deactivate() {
}
