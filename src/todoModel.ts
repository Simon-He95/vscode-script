import fs from 'node:fs'
import * as vscode from 'vscode'
import { nanoid } from 'nanoid'
import type { ExtensionContext } from 'vscode'

export class TodoItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState)
  }
}

export class TodoDataProvider implements vscode.TreeDataProvider<TodoItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TodoItem | undefined | void> = new vscode.EventEmitter<TodoItem | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<TodoItem | undefined | void> = this._onDidChangeTreeData.event

  private scripts: Record<string, { id: string; name?: string; children?: TodoItem[]; time: string; datetime: string }> = {}
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
      debugger
      const { name, scripts, workspace } = pkgJSON
      if (scripts) {
        // 如果有scripts再做处理
        const temp = {
          id: 'root',
          treeItem: new TodoItem(name ? `root: ${name}` : 'root', vscode.TreeItemCollapsibleState.Expanded),
          children: Object.keys(scripts).map((script) => {
            const item = new TodoItem(script, vscode.TreeItemCollapsibleState.None) as any
            item.id = nanoid()
            item.iconPath = {
              light: vscode.Uri.file(this.extensionContext.asAbsolutePath('assets/light/run.svg')),
              dark: vscode.Uri.file(this.extensionContext.asAbsolutePath('assets/dark/run.svg')),
            }
            return item
          }),
        }
      }
      if (workspace) {
        // 如果存在workspace，用yarn来处理
      }
      else {
        // 判断是否是pnpm workspace
      }
    }
    catch (error: any) {
      debugger
      vscode.window.showErrorMessage(error.message)
    }
    // const add = '添加你的计划'
    // const treeItem = new TodoItem(add, vscode.TreeItemCollapsibleState.None) as any
    // treeItem.command = {
    //   command: 'todoList.addTodo',
    //   title: add,
    //   tooltip: add,
    // }

    // return treeItem
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: any): vscode.TreeItem {
    debugger
    return element.id === 'root' ? element.treeItem : element
  }

  getChildren(element?: any): Thenable<TodoItem[]> {
    if (element) {
      // sort: 做一个按照时间的排序
      return element
    }
    else {
      return this.#init() as any
    }
  }
}
