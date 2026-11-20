export function createClient(): never {
  throw new Error('浏览器不再连接 Supabase，请使用 lib/auth/session')
}
