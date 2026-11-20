import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const roots = ['app', 'components', 'hooks', 'lib', 'store']
const allow = new Set([
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/supabase/middleware.ts',
  'lib/platform/client.ts',
  // These paths still need a privileged server credential. They are not
  // reachable from the browser and are documented as unfinished.
  'lib/interview-referrals.ts',
  'app/auth/callback/route.ts',
  'app/api/telegram/webhook/route.ts',
  'app/api/admin/users/route.ts',
  // Telegram tables are revoked from anon/authenticated. Message text itself
  // is saved through the platform API.
  'app/api/chat/messages/route.ts',
  // Grants VIP on another user and may create a missing profile through Auth Admin.
  'app/api/admin/users/membership/route.ts',
])

const queryPattern = /\.from\(\s*['"`]|createAdminClient\(|\.rpc\(\s*['"`]/
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
