import fsp from 'node:fs/promises'
import fg from 'fast-glob'

interface IParams {
  name: string
  scripts: Record<string, string>
}
export async function readGlob(packages: string[], cwd: string) {
  const entries = await fg(
    packages.map(v => `${v}/package.json`),
    { dot: true, ignore: ['**/node_modules/**'], cwd },
  )

  return Promise.all(
    entries.map(async (v) => {
      try {
        const pkg = JSON.parse(await fsp.readFile(`${cwd}/${v}`, 'utf-8'))
        if (!pkg)
          return
        const { name, scripts } = pkg
        return { name, scripts }
      }
      catch (error) {
        return {}
      }
    }) as Promise<IParams>[],
  ).then(v =>
    v.reduce((result, v) => {
      const { name, scripts } = v
      // 过滤没有scripts或name的子包
      if (!name || !scripts)
        return result
      result[name] = scripts
      return result
    }, {} as Record<string, Record<string, string>>),
  )
}

export function parserYAML(str: string) {
  const result: string[] = []
  for (const match of str.matchAll(/\n\s+- ['"]?([^\s"']+)/g)) {
    if (!match)
      continue
    result.push(match[1])
  }
  return result
}
