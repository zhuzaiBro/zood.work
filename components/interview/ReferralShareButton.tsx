'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ReferralShareButtonProps = {
  sharePath: string
  title: string
  collectionId?: string | null
  className?: string
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  )
}

export default function ReferralShareButton({
  sharePath,
  title,
  collectionId,
  className,
}: ReferralShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied'>('idle')
  const router = useRouter()
  const defaultClassName = 'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50'

  const loginRedirect = useMemo(() => {
    const redirect = typeof window === 'undefined' ? sharePath : window.location.pathname + window.location.search
    return `/login?redirect=${encodeURIComponent(redirect)}`
  }, [sharePath])

  const handleShare = async () => {
    setStatus('copying')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push(loginRedirect)
      return
    }

    const url = new URL(sharePath, window.location.origin)
    url.searchParams.set('ref', user.id)
    if (collectionId) {
      url.searchParams.set('refCollection', collectionId)
    }

    const shareText = `我在油条TV刷这套面试题：${title}。好友通过链接注册后，我可以获得 1 天免费会员。`

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: url.toString(),
        })
        setStatus('copied')
        window.setTimeout(() => setStatus('idle'), 1800)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setStatus('idle')
          return
        }
      }
    }

    await navigator.clipboard.writeText(`${shareText}\n${url.toString()}`)
    setStatus('copied')
    window.setTimeout(() => setStatus('idle'), 1800)
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={status === 'copying'}
      className={className ?? defaultClassName}
      title="好友通过你的分享链接注册后，你可获得 1 天免费会员"
    >
      <ShareIcon />
      {status === 'copied' ? '已复制' : status === 'copying' ? '处理中' : '分享'}
    </button>
  )
}
