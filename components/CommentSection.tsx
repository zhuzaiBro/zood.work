import { serverUser } from '@/lib/auth/server'
import { platformServer } from '@/lib/platform/server'
import CommentForm from '@/components/CommentForm'
import CommentList from '@/components/CommentList'

interface CommentSectionProps {
  postId: string
}

export default async function CommentSection({ postId }: CommentSectionProps) {
  const user = await serverUser()

  let comments: any[] | null = null
  try {
    const result = await platformServer<{ comments: any[] }>(
      `/api/platform/posts/${encodeURIComponent(postId)}/comments`,
    )
    comments = result.comments ?? []
  } catch (error) {
    console.error('Error fetching comments:', error)
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
      <h2 className="text-2xl font-bold mb-6">
        评论 {comments ? `(${comments.length})` : ''}
      </h2>

      {user ? (
        <CommentForm postId={postId} />
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            <a href="/login" className="text-blue-600 hover:text-blue-800">
              登录
            </a>
            {' '}后发表评论
          </p>
        </div>
      )}

      {comments && comments.length > 0 ? (
        <CommentList comments={comments} postId={postId} />
      ) : (
        <div className="text-center py-8 text-gray-500">
          暂无评论，快来抢沙发吧！
        </div>
      )}
    </div>
  )
}

