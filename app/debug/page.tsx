'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    const info = {
      // 环境变量检查
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置',
        supabaseKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
          ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...'
          : '未设置',
      },
      // 浏览器信息
      browser: {
        userAgent: navigator.userAgent,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      },
      // 当前 URL
      location: {
        href: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host,
      },
    }
    setDebugInfo(info)
  }, [])

  const testSupabaseConnection = async () => {
    setTestResult('测试中...')
    try {
      const supabase = createClient()
      console.log('Supabase 客户端创建成功')

      // 测试认证状态
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('获取用户信息:', { user, userError })

      if (userError) {
        setTestResult(`❌ 获取用户失败: ${userError.message}`)
        return
      }

      if (!user) {
        setTestResult('⚠️ 未登录状态（这是正常的）')
        return
      }

      // 测试数据库查询
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      console.log('获取用户资料:', { profile, profileError })

      if (profileError) {
        setTestResult(`❌ 查询用户资料失败: ${profileError.message}`)
        return
      }

      setTestResult(`✅ 连接成功！用户: ${profile?.username || user.id}`)
    } catch (error) {
      console.error('测试失败:', error)
      setTestResult(`❌ 测试失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">环境诊断工具</h1>

        {/* 环境变量 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">环境变量检查</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className={debugInfo.env?.hasSupabaseUrl ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.env?.hasSupabaseUrl ? '✅' : '❌'}
              </span>
              <span>NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className="text-gray-600">{debugInfo.env?.supabaseUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={debugInfo.env?.hasSupabaseKey ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.env?.hasSupabaseKey ? '✅' : '❌'}
              </span>
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className="text-gray-600">{debugInfo.env?.supabaseKeyPrefix}</span>
            </div>
          </div>
        </div>

        {/* 浏览器信息 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">浏览器信息</h2>
          <div className="space-y-2 font-mono text-sm text-gray-600">
            <div>Cookie 已启用: {debugInfo.browser?.cookieEnabled ? '✅ 是' : '❌ 否'}</div>
            <div>在线状态: {debugInfo.browser?.onLine ? '✅ 在线' : '❌ 离线'}</div>
            <div>User Agent: {debugInfo.browser?.userAgent}</div>
          </div>
        </div>

        {/* 当前位置 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">当前位置</h2>
          <div className="space-y-2 font-mono text-sm text-gray-600">
            <div>URL: {debugInfo.location?.href}</div>
            <div>协议: {debugInfo.location?.protocol}</div>
            <div>主机: {debugInfo.location?.host}</div>
          </div>
        </div>

        {/* 连接测试 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Supabase 连接测试</h2>
          <button
            onClick={testSupabaseConnection}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
          >
            开始测试
          </button>
          {testResult && (
            <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
              {testResult}
            </div>
          )}
        </div>

        {/* 控制台提示 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 提示：请打开浏览器控制台（F12）查看详细日志
          </p>
        </div>
      </div>
    </div>
  )
}

