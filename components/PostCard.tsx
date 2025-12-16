import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  created_at: string | null;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`}>
      <article className="bg-black/30 backdrop-blur-sm border-white/10 border rounded-xl shadow-md p-6 mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2 text-white hover:text-blue-400">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-gray-300 mb-4 line-clamp-3">{post.excerpt}</p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              {post.author?.avatar_url && (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.display_name || post.author.username}
                  className="w-8 h-8 rounded-full bg-white"
                />
              )}
              <span>
                {post.author?.display_name || post.author?.username || "匿名"}
              </span>
            </div>

            {post.created_at && (
              <time dateTime={post.created_at}>
                {formatDate(post.created_at)}
              </time>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
