'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
}

interface ProfileFormProps {
  profile: Profile | null
  userId: string
}

export default function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [username, setUsername] = useState(profile?.username || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { updateUserProfile } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      // 使用 useAuth hook 更新资料，会自动更新 Zustand store
      const { error: updateError } = await updateUserProfile({
        username: username.trim(),
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
      })

      if (updateError) throw updateError

      setMessage('资料更新成功！')
      router.refresh()
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || '更新失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-2">
          用户名 <span className="text-red-500">*</span>
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium mb-2">
          显示名称
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="avatarUrl" className="block text-sm font-medium mb-2">
          头像 URL
        </label>
        <input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
          placeholder="https://example.com/avatar.jpg"
        />
        {avatarUrl && (
          <div className="mt-2">
            <img
              src={avatarUrl}
              alt="头像预览"
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-2">
          个人简介
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
          rows={4}
          disabled={isLoading}
          placeholder="介绍一下你自己..."
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isLoading ? '保存中...' : '保存资料'}
      </button>
    </form>
  )
}

