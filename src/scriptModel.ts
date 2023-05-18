import fs from 'node:fs'
import * as vscode from 'vscode'
import { nanoid } from 'nanoid'
import type { ExtensionContext, TreeItemLabel } from 'vscode'
import { parserYAML, readGlob } from './common'

export class TodoItem extends vscode.TreeItem {
  constructor(
    public readonly label: string | TreeItemLabel,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState)
  }
}

// todo: 修改一下图标样式
export class ScriptProvider implements vscode.TreeDataProvider<TodoItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TodoItem | undefined | void> = new vscode.EventEmitter<TodoItem | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<TodoItem | undefined | void> = this._onDidChangeTreeData.event

  private scripts: any[] = []
  private projectPath: string
  id = '0'
  extensionContext: ExtensionContext
  constructor(extensionContext: ExtensionContext, projectPath: string) {
    this.extensionContext = extensionContext
    this.projectPath = projectPath
  }

  async #init() {
    // 判断当前目录下是否有package.json
    const pkg = `${this.projectPath}/package.json`
    const pnpmworkspace = `${this.projectPath}/pnpm-workspace.yaml`
    if (!fs.existsSync(pkg)) {
      const treeItem = new TodoItem('未找到可执行的命令', vscode.TreeItemCollapsibleState.None) as any
      treeItem.id = nanoid()
      treeItem.iconPath = {
        light: vscode.Uri.file(this.extensionContext.asAbsolutePath('assets/light/404.svg')),
        dark: vscode.Uri.file(this.extensionContext.asAbsolutePath('assets/dark/404.svg')),
      }
      return [treeItem]
    }
    // 首先加入pkg
    try {
      const pkgJSON = JSON.parse(await fs.promises.readFile(pkg, 'utf8'))
      const { name, scripts, workspace } = pkgJSON
      let cli: 'npm' | 'yarn' | 'pnpm' = 'npm'
      if (workspace) {
        // 如果存在workspace，用yarn来处理
        cli = 'yarn'
        const _workspace = Array.isArray(workspace)
          ? workspace
          : workspace.packages ?? []
        if (_workspace.length) {
          const data = await readGlob(_workspace, this.projectPath)
          this.scripts.push(...Object.keys(data).map(name => this.#createRoot(data[name], name, 'workspace', cli)))
        }
      }
      else
      if (fs.existsSync(pnpmworkspace)) {
        // 判断是否是pnpm workspace
        cli = 'pnpm'
        const content = await fs.promises.readFile(pnpmworkspace, 'utf-8')
        const _workspace = parserYAML(content)
        if (_workspace.length) {
          const data = await readGlob(_workspace, this.projectPath)
          this.scripts.push(...Object.keys(data).map(name => this.#createRoot(data[name], name, 'workspace', cli)))
        }
      }
      if (scripts) {
        // 如果有scripts再做处理
        this.scripts.unshift(this.#createRoot(scripts, name, 'root', cli))
      }
      return this.scripts
    }
    catch (error: any) {
      vscode.window.showErrorMessage(error.message)
    }
  }

  #createRoot(scripts: Record<string, string>, name: string, type: 'root' | 'workspace', cli: 'pnpm' | 'npm' | 'yarn' = 'npm') {
    // workspace默认不展开
    const treeItem = new TodoItem(
      name
        ? `[${type}]: ${name}`
        : type,
      type === 'root'
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed)
    treeItem.iconPath = {
      light: vscode.Uri.file(this.extensionContext.asAbsolutePath(`assets/light/${type === 'root' ? 'npm' : 'pnpm'}.svg`)),
      dark: vscode.Uri.file(this.extensionContext.asAbsolutePath(`assets/dark/${type === 'root' ? 'npm' : 'pnpm'}.svg`)),
    }
    const temp = {
      id: 'root',
      treeItem,
      children: Object.keys(scripts).map((key) => {
        const value = scripts[key]
        const label = `${key} 🔛 ${value}`
        const item = new TodoItem({ label, highlights: [[0, 0]] }, vscode.TreeItemCollapsibleState.None) as any
        item.id = nanoid()

        item.iconPath = {
          light: vscode.Uri.file(this.extensionContext.asAbsolutePath(`assets/light/run${Math.floor(Math.random() * 14) + 1}.svg`)),
          dark: vscode.Uri.file(this.extensionContext.asAbsolutePath(`assets/light/run${Math.floor(Math.random() * 14) + 1}.svg`)),
        }
        item.command = {
          command: 'vscode-scripts.run',
          tooltip: label,
          arguments: [key, cli, type === 'root' ? undefined : name],
        }
        return item
      }),
    }
    return temp
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: any): vscode.TreeItem {
    return element.id === 'root' ? element.treeItem : element
  }

  getChildren(element?: any): Thenable<TodoItem[]> {
    if (element)
      return element.children

    else
      return this.#init() as any
  }
}
