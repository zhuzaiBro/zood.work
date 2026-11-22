import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const retiredProject = 'amnksdnwvwmmmvqoxzyj'

export function createSupportRealtimeClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes(retiredProject)) {
    throw new Error('Supabase 环境变量未配置')
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export async function subscribeSupportBroadcast(options: {
  topic: string
  token: string
  onMessage: (payload: unknown) => void
  onStatus: (status: string) => void
}) {
  if (!options.topic.startsWith('support.v1.')) {
    throw new Error('实时频道不合法')
  }
  const client = createSupportRealtimeClient()
  await client.realtime.setAuth(options.token)
  let lastStatus = ''
  const channel = client.channel(options.topic, { config: { private: true } })
  channel.on('broadcast', { event: 'message' }, (message) => {
    options.onMessage(message.payload)
  })
  channel.subscribe((status) => {
    if (status === lastStatus) return
    lastStatus = status
    options.onStatus(status)
  })
  return async () => {
    await client.removeChannel(channel)
  }
}
