import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const roots = ['app', 'components', 'hooks', 'lib', 'store']
const allow = new Set([
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/supabase/middleware.ts',
  'lib/platform/client.ts',
])

const queryPattern = /(?<!\bBuffer)\.from\(\s*['"`]|createAdminClient\(|\.rpc\(\s*['"`]/
const failures = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      walk(path)
      continue
    }
    if (!path.endsWith('.ts') && !path.endsWith('.tsx')) continue
    const relative = path.slice(root.length).replace(/^\/+/, '')
    if (allow.has(relative)) continue
    const text = readFileSync(path, 'utf8')
    if (queryPattern.test(text)) {
      failures.push(relative)
    }
  }
}

for (const dir of roots) walk(join(root, dir))

if (failures.length) {
  console.error('Direct business Supabase queries remain:')
  failures.forEach((file) => console.error(`- ${file}`))
  process.exit(1)
}

console.log('No direct business Supabase queries outside the documented exceptions.')
