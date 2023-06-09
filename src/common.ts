import fsp from 'node:fs/promises'
import fg from 'fast-glob'

interface IParams {
  name: string
  scripts: Record<string, string>
  relativepath: string
}
export async function readGlob(packages: string[], cwd: string) {
  const entries = await fg(
    packages.map(v => `${v}/package.json`),
    { dot: true, ignore: ['**/node_modules/**', '**/dist/**'], cwd },
  )

  return Promise.all(
    entries.map(async (v) => {
      try {
        const pkg = JSON.parse(await fsp.readFile(`${cwd}/${v}`, 'utf-8'))
        if (!pkg)
          return
        const { name, scripts } = pkg
        return { name, scripts, relativepath: v }
      }
      catch (error) {
        return {}
      }
    }) as Promise<IParams>[],
  ).then(v =>
    v.reduce((result, v) => {
      const { name, scripts, relativepath } = v
      // 过滤没有scripts或name的子包
      if (name && scripts)
        result[name] = [relativepath, scripts]
      return result
    }, {} as Record<string, [string, Record<string, string>]>),
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

export function readMakefile(filepath: string): Promise<{ name: string; detail: string }[]> {
  return new Promise((resolve) => {
    fsp.readFile(filepath, 'utf-8')
      .then((res) => {
        const commandNames: { name: string; detail: string }[] = []
        for (const match of res.matchAll(/.PHONY:\s*([\w0-9\-]+)/g)) {
          let name
          // eslint-disable-next-line no-cond-assign
          if (!match || !(name = match[1]))
            continue
          // 根据名字匹配脚本信息
          const commandReg = new RegExp(`^${name}:[\n\\s]*([^\n\\\\;]+)`, 'sm')
          const detailMatcher = res.match(commandReg)
          if (!detailMatcher)
            continue
          const detail = `${detailMatcher[1].trim()}...`
          commandNames.push({ name, detail })
        }
        resolve(commandNames)
      }).catch(resolve)
  })
}
