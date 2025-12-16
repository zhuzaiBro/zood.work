'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import CommentForm from '@/components/CommentForm'

interface Comment {
  id: string
  content: string
  created_at: string | null
  parent_id: string | null
  user_profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface CommentListProps {
  comments: Comment[]
  postId: string
}

export default function CommentList({ comments, postId }: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // 组织评论树结构
  const commentTree = comments.reduce((acc, comment) => {
    if (!comment.parent_id) {
      acc.push({ ...comment, replies: [] })
    }
    return acc
  }, [] as (Comment & { replies: Comment[] })[])

  // 添加回复
  comments.forEach((comment) => {
    if (comment.parent_id) {
      const parent = commentTree.find((c) => c.id === comment.parent_id)
      if (parent) {
        parent.replies.push(comment)
      }
    }
  })

  const CommentItem = ({ comment, isReply = false }: { comment: Comment & { replies?: Comment[] }, isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12' : ''} mb-4`}>
      <div className="flex gap-3">
        {comment.user_profiles?.avatar_url ? (
          <img
            src={comment.user_profiles.avatar_url}
            alt={comment.user_profiles.display_name || comment.user_profiles.username}
            className="w-10 h-10 rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
        )}

        <div className="flex-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {comment.user_profiles?.display_name || comment.user_profiles?.username || '匿名'}
              </span>
              {comment.created_at && (
                <time className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(comment.created_at)}
                </time>
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
          >
            回复
          </button>

          {replyingTo === comment.id && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCancel={() => setReplyingTo(null)}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {commentTree.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  )
}

