export async function createClient(): Promise<never> {
  throw new Error('服务端不再连接 Supabase，请使用 lib/auth/server')
}
