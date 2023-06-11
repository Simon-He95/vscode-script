import * as vscode from 'vscode'
import { watch } from 'chokidar'
import { message, openFile } from '@vscode-use/utils'
import { getwebviewScript } from '../media/webview'
import { getwebviewHtml } from '../media/webviewHtml'
import { readMakefile } from './common'
import { webviewProvider } from './webviewProvider'
import { getScripts, transformScriptToTreeData } from './utils'

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders)
    return
  const { auth = '' } = vscode.workspace.getConfiguration('vscode-script')
  const projectPath = workspaceFolders[0].uri.fsPath
  const scripts = await getScripts(projectPath)
  let treeData = transformScriptToTreeData(scripts)
  const CREATED_TERMINAL: any[] = []

  const provider = webviewProvider(
    context, {
      treeData,
    },
    async (data) => {
      const { type, value } = data
      const _value = JSON.parse(value)
      if (type === 'run') {
        if (_value.absolutePath) {
          const makefilePath = `${_value.absolutePath}/Makefile`
          const commands = await readMakefile(makefilePath)
          if (!commands.length) {
            message(`未能在${makefilePath}中找到可以执行的命令`)
            return
          }
          // 我电脑没有权限暂时使用sudo make来启动
          const runCommand = `cd ${_value.absolutePath} && choose=$(echo "${commands.join('\\n')}" | gum filter --placeholder=" 请选择一个命令") && ${auth} make $choose || echo "已取消"`.replace(/\s+/g, ' ')
          // 是否已经创建过次终端
          const hasCreatedTerminal = CREATED_TERMINAL.find((_terminal) => {
            const { projectPath, script } = _terminal
            return projectPath === makefilePath && script === runCommand
          })

          if (hasCreatedTerminal) {
            // 如果创建了就激活当前终端再次执行命令，而不重新打开新的
            const targetTerminal = hasCreatedTerminal.terminal
            targetTerminal.sendText(runCommand)
            // 聚焦到此终端
            targetTerminal.show()
            return
          }
          // 新开终端执行
          const terminal = vscode.window.createTerminal(_value.label)
          const id = await terminal.processId!

          CREATED_TERMINAL.push({
            id,
            projectPath: makefilePath,
            script: runCommand,
            terminal,
          })
          terminal.show()
          // 等待终端初始化完成输出指令
          terminal.processId.then(() => setTimeout(() => terminal.sendText(runCommand), 800))
        }
        else {
          runTerminal(_value)
        }
      }
      else if (type === 'view') {
        const absolutePath = _value.absolutePath
          ? `${_value.absolutePath}/Makefile`
          : `${projectPath}/${_value.relativePath}`
        openFile(absolutePath)
      }
    },
  )

  async function runTerminal(args: any) {
    const { label: script, env, workspaceName, projectPath: _projectPath } = args
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

    // 是否已经创建过次终端
    const hasCreatedTerminal = CREATED_TERMINAL.find((_terminal) => {
      const { projectPath, script: _script } = _terminal
      return projectPath === _projectPath && _script === script
    })

    if (hasCreatedTerminal) {
      // 如果创建了就激活当前终端再次执行命令，而不重新打开新的
      const targetTerminal = hasCreatedTerminal.terminal
      targetTerminal.sendText(runCommand)
      // 聚焦到此终端
      targetTerminal.show()
      return
    }

    // 新开终端执行
    const terminal = vscode.window.createTerminal(script)
    terminal.show()
    const id = await terminal.processId!

    CREATED_TERMINAL.push({
      id,
      projectPath: _projectPath,
      script,
      terminal,
    })
    // 等待终端初始化完成输出指令
    terminal.processId.then(() => setTimeout(() => terminal.sendText(runCommand), 800))
  }

  context.subscriptions.push(vscode.window.onDidCloseTerminal(async (terminal) => {
    const id = await terminal.processId
    if (!id)
      return
    const idx = CREATED_TERMINAL.findIndex(_terminal => _terminal.id === id)
    if (idx !== -1)
      CREATED_TERMINAL.splice(idx, 1)
  }))

  // 监听文件变化 package.json 和 Makefile
  const watcher = watch(['**/package.json', '**/Makefile'], {
    cwd: projectPath,
    depth: 20,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  })

  watcher.on('change', async () => {
    const scripts = await getScripts(projectPath)
    treeData = transformScriptToTreeData(scripts)
    provider.deferScript(getwebviewScript({
      treeData,
    }))
    provider.refresh(getwebviewHtml())
  })
}

export function deactivate() {
}
