import * as vscode from 'vscode'
import { ScriptProvider } from './scriptModel'

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (workspaceFolders) {
    const projectPath = workspaceFolders[0].uri.fsPath
    const todoDataProvider = new ScriptProvider(context, projectPath)
    context.subscriptions.push(vscode.window.registerTreeDataProvider('vscode-scripts.id', todoDataProvider))
    context.subscriptions.push(vscode.commands.registerCommand('vscode-icones.switch', () => vscode.commands.executeCommand('workbench.view.extension.scripts')))
    context.subscriptions.push(vscode.commands.registerCommand('vscode-scripts.run', async (script, env: 'npm' | 'yarn' | 'pnpm', workspaceName: string) => {
      let runCommand = ''
      if (!workspaceName) {
      // 根据当前环境执行npm ｜ yarn ｜ pnpm
        switch (env) {
          case 'npm':
            runCommand = `npm run ${script}`
            break
          case 'yarn':
            runCommand = `yarn ${script}`
            break
          case 'pnpm':
            runCommand = `pnpm ${script}`
            break
        }
      }
      else {
        switch (env) {
          case 'yarn':
            runCommand = `yarn workspace ${workspaceName} ${script}`
            break
          case 'pnpm':
            runCommand = `pnpm --filter="${workspaceName}" ${script}`
            break
        }
      }
      // 新开终端执行
      const terminal = vscode.window.createTerminal()
      terminal.show()
      // 等待终端初始化完成输出指令
      terminal.processId.then(() => setTimeout(() => terminal.sendText(runCommand), 800))
    }))
  }
}

export function deactivate() {
}
