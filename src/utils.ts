import fs from 'node:fs'
import fg from 'fast-glob'
import { message } from '@vscode-use/utils'
import { parserYAML, readGlob } from './common'

export async function getScripts(projectPath: string) {
  const result = []
  const cwd = projectPath
  let pkg = `${projectPath}/package.json`
  let pnpmworkspace = `${projectPath}/pnpm-workspace.yaml`
  let relativePath = ''
  if (!fs.existsSync(pkg)) {
    // 只获取最多4层深度
    const entries = await fg(
      '**/package.json',
      { dot: true, ignore: ['**/node_modules/**', '**/dist/**'], cwd: projectPath, deep: 4 },
    )
    if (entries.length === 0)
      return []

    relativePath = entries[0]
    pkg = `${projectPath}/${entries[0]}`
    projectPath = pkg.split('/').slice(0, -1).join('/')
    pnpmworkspace = `${projectPath}/pnpm-workspace.yaml`
  }
  try {
    const pkgJSON = JSON.parse(await fs.promises.readFile(pkg, 'utf8'))
    const { name, scripts, workspace } = pkgJSON
    let cli: 'npm' | 'yarn' | 'pnpm' = 'npm'
    if (workspace) {
      // 如果存在workspace，用yarn来处理
      cli = 'yarn'
      const _workspace = Array.isArray(workspace) ? workspace : workspace.packages ?? []
      await pushWorkspaceScripts(_workspace)
    }
    else if (fs.existsSync(pnpmworkspace)) {
      // 判断是否是pnpm workspace
      cli = 'pnpm'
      const _workspace = parserYAML(await fs.promises.readFile(pnpmworkspace, 'utf-8'))
      await pushWorkspaceScripts(_workspace)
    }
    if (scripts) {
      // 如果有scripts再做处理
      relativePath = `${projectPath.replace(`${cwd}/`, '')}/package.json`
      result.unshift({
        scripts,
        label: name || 'No Name',
        relativePath: relativePath[0] === '/' ? 'package.json' : relativePath,
        projectPath,
        type: 'root',
        cli,
      })
    }
    return result

    async function pushWorkspaceScripts(_workspace: string[]) {
      if (!_workspace.length)
        return
      const data = await readGlob(_workspace, projectPath)
      const _prefix = projectPath.replace(`${cwd}/`, '')
      result.push(...Object.keys(data).map(name => ({
        scripts: data[name][1],
        relativePath: `${_prefix}/${data[name][0]}`,
        projectPath,
        label: name,
        type: 'workspace',
        cli,
      })))
    }
  }
  catch (error: any) {
    message.error(error.message)
  }
  finally {
    // 判断是否有makefile文件
    const entries = await fg(
      '**/Makefile',
      { ignore: ['**/node_modules/**', '**/dist/**'], cwd, deep: 4 },
    )
    if (entries.length) {
      result.push(...entries.map(filepath => ({
        type: 'makefile',
        absolutePath: `${cwd}/${filepath.split('/').slice(0, -1).join('/')}`,
        filepath,
      })))
    }
  }
}

export function transformScriptToTreeData(scripts: any) {
  return scripts.map((script: any) => {
    if (script.type === 'makefile') {
      return {
        label: script.filepath,
        absolutePath: script.absolutePath,
        type: 'makefile',
      }
    }
    const projectPath = script.projectPath
    const env = script.cli
    const workspaceName = script.type === 'workspace' ? script.label : undefined
    script.children = Object.keys(script.scripts).map((key) => {
      return {
        label: key,
        detail: script.scripts[key],
        projectPath,
        env,
        workspaceName,
      }
    })
    return script
  })
}
