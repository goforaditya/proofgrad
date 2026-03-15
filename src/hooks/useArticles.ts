import { supabase } from '@/lib/supabase'
import type { Article } from '@/types'

// -------------------------------------------------------
// Slug generation
// -------------------------------------------------------
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// -------------------------------------------------------
// Fetch all published articles
// -------------------------------------------------------
export async function fetchArticles(): Promise<Article[]> {
  const { data } = await supabase
    .from('articles')
    .select('*, users(name)')
    .order('published_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    ...row,
    author_name: row.users?.name ?? 'Unknown',
    users: undefined,
  })) as Article[]
}

// -------------------------------------------------------
// Fetch recent articles (for landing page)
// -------------------------------------------------------
export async function fetchRecentArticles(limit: number): Promise<Article[]> {
  const { data } = await supabase
    .from('articles')
    .select('*, users(name)')
    .order('published_at', { ascending: false })
    .limit(limit)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    ...row,
    author_name: row.users?.name ?? 'Unknown',
    users: undefined,
  })) as Article[]
}

// -------------------------------------------------------
// Fetch a single article by ID
// -------------------------------------------------------
export async function fetchArticleById(
  articleId: string
): Promise<{ article: Article | null; error: string | null }> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single()

  if (error) return { article: null, error: error.message }
  return { article: data as Article, error: null }
}

// -------------------------------------------------------
// Fetch a single article by slug
// -------------------------------------------------------
export async function fetchArticleBySlug(
  slug: string
): Promise<{ article: Article | null; error: string | null }> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return { article: null, error: error.message }
  return { article: data as Article, error: null }
}

// -------------------------------------------------------
// Create article (instructor)
// -------------------------------------------------------
export async function createArticle(
  authorId: string,
  title: string,
  content: string,
  tags: string[],
  pinnedSessionId?: string
): Promise<{ article: Article | null; error: string | null }> {
  const slug = generateSlug(title)
  const { data, error } = await supabase
    .from('articles')
    .insert({
      author_id: authorId,
      slug,
      title,
      content,
      tags,
      pinned_session_id: pinnedSessionId ?? null,
    })
    .select()
    .single()

  if (error) return { article: null, error: error.message }
  return { article: data as Article, error: null }
}

// -------------------------------------------------------
// Update article
// -------------------------------------------------------
export async function updateArticle(
  articleId: string,
  updates: { title?: string; content?: string; tags?: string[]; pinned_session_id?: string | null }
): Promise<{ article: Article | null; error: string | null }> {
  const payload: Record<string, unknown> = { ...updates }
  if (updates.title) {
    payload.slug = generateSlug(updates.title)
  }
  const { data, error } = await supabase
    .from('articles')
    .update(payload)
    .eq('id', articleId)
    .select()
    .single()

  if (error) return { article: null, error: error.message }
  return { article: data as Article, error: null }
}

// -------------------------------------------------------
// Delete article
// -------------------------------------------------------
export async function deleteArticle(
  articleId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', articleId)

  if (error) return { error: error.message }
  return { error: null }
}

// -------------------------------------------------------
// Fetch instructor's articles
// -------------------------------------------------------
export async function fetchMyArticles(authorId: string): Promise<Article[]> {
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('author_id', authorId)
    .order('published_at', { ascending: false })

  return (data ?? []) as Article[]
}
