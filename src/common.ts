import fg from 'fast-glob'
import { getPkg } from 'lazy-js-utils'

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
      const pkg = await getPkg(`${cwd}/${v}`)
      if (!pkg)
        return
      const { name, scripts } = pkg
      return { name, scripts }
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
