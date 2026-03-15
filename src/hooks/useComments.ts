import { supabase } from '@/lib/supabase'
import type { Comment } from '@/types'

// -------------------------------------------------------
// Fetch comments for an article (with author info)
// -------------------------------------------------------
export async function fetchComments(articleId: string): Promise<Comment[]> {
  const { data } = await supabase
    .from('comments')
    .select('*, users(name, role)')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    ...row,
    user_name: row.users?.name ?? 'Anonymous',
    user_role: row.users?.role ?? 'student',
    users: undefined,
  })) as Comment[]
}

// -------------------------------------------------------
// Create a comment
// -------------------------------------------------------
export async function createComment(
  articleId: string,
  userId: string,
  content: string
): Promise<{ comment: Comment | null; error: string | null }> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ article_id: articleId, user_id: userId, content })
    .select('*, users(name, role)')
    .single()

  if (error) return { comment: null, error: error.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any
  return {
    comment: {
      ...row,
      user_name: row.users?.name ?? 'Anonymous',
      user_role: row.users?.role ?? 'student',
      users: undefined,
    } as Comment,
    error: null,
  }
}

// -------------------------------------------------------
// Delete a comment
// -------------------------------------------------------
export async function deleteComment(
  commentId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) return { error: error.message }
  return { error: null }
}
