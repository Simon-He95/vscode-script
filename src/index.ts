import * as vscode from 'vscode'
import { watch } from 'chokidar'
import { ScriptProvider } from './scriptModel'
import { readMakefile } from './common'

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders)
    return
  const { auth = '' } = vscode.workspace.getConfiguration('vscode-script')
  const projectPath = workspaceFolders[0].uri.fsPath
  const todoDataProvider = new ScriptProvider(context, projectPath)
  context.subscriptions.push(vscode.window.registerTreeDataProvider('vscode-scripts.id', todoDataProvider))
  context.subscriptions.push(vscode.commands.registerCommand('vscode-scripts.switch', () => vscode.commands.executeCommand('workbench.view.extension.scripts')))
  context.subscriptions.push(vscode.commands.registerCommand('vscode-scripts.run', async (...args) => {
    runTerminal(args)
  }))
  context.subscriptions.push(vscode.commands.registerCommand('vscode-scripts.runMakefile', async (filepath: string) => {
    // 读取Makefile文件内容提取所有的命令, 用gum来选择
    const makefilePath = `${filepath}/Makefile`
    const commands = await readMakefile(makefilePath)
    if (!commands.length)
      return vscode.window.showInformationMessage(`未能在${makefilePath}中找到可以执行的命令`)
    // 我电脑没有权限暂时使用sudo make来启动
    const runCommand = `cd ${filepath} && choose=$(echo "${commands.join('\\n')}" | gum filter --placeholder=" 请选择一个命令") && ${auth} make $choose || echo "已取消"`.replace(/\s+/g, ' ')
    // 新开终端执行
    const terminal = vscode.window.createTerminal()
    terminal.show()
    // 等待终端初始化完成输出指令
    terminal.processId.then(() => setTimeout(() => terminal.sendText(runCommand), 800))
  }))
  context.subscriptions.push(vscode.commands.registerCommand('vscode-scripts.runDebug', async (item: any) => {
    const { command } = item
    if (!command)
      return
    runTerminal(command.arguments, 'JavaScript Debug Terminal')
  }))
  context.subscriptions.push(vscode.commands.registerCommand('vscode-scripts.view', ({ view }: any) => {
    if (!view)
      return
    vscode.workspace.openTextDocument(view).then(
      doc => vscode.window.showTextDocument(doc))
  }))
  function runTerminal(args: any, terminalName = '') {
    const [script, env, workspaceName, _projectPath] = args
    let runCommand = ''
    if (projectPath !== _projectPath)
      runCommand += `cd ${_projectPath} && `

    if (!workspaceName) {
      // 根据当前环境执行npm ｜ yarn ｜ pnpm
      switch (env) {
        case 'npm':
          runCommand += `npm run ${script}`
          break
        case 'yarn':
          runCommand += `yarn ${script}`
          break
        case 'pnpm':
          runCommand += `pnpm ${script}`
          break
      }
    }
    else {
      switch (env) {
        case 'yarn':
          runCommand += `yarn workspace ${workspaceName} ${script}`
          break
        case 'pnpm':
          runCommand += `pnpm --filter="${workspaceName}" ${script}`
          break
      }
    }
    // 新开终端执行
    const terminal = vscode.window.createTerminal(terminalName)
    terminal.show()
    // 等待终端初始化完成输出指令
    terminal.processId.then(() => setTimeout(() => terminal.sendText(runCommand), 800))
  }
  // 监听文件变化 package.json 和 Makefile
  const watcher = watch(['**/package.json', '**/Makefile'], {
    cwd: projectPath,
    depth: 20,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  })
  watcher.on('change', () => {
    todoDataProvider.refresh()
  })
}

export function deactivate() {
}
