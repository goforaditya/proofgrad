import { supabase } from '@/lib/supabase'
import type { ResourceLink, LinkReaction, LinkComment, ReactionEmoji } from '@/types'

// -------------------------------------------------------
// Fetch all resource links (ordered by niche, then position)
// -------------------------------------------------------
export async function fetchResourceLinks(): Promise<ResourceLink[]> {
  const { data } = await supabase
    .from('resource_links')
    .select('*')
    .order('niche', { ascending: true })
    .order('position', { ascending: true })

  return (data ?? []) as ResourceLink[]
}

// -------------------------------------------------------
// Create a resource link (instructor)
// -------------------------------------------------------
export async function createResourceLink(
  instructorId: string,
  title: string,
  url: string,
  niche: string,
  description?: string
): Promise<{ link: ResourceLink | null; error: string | null }> {
  const { data, error } = await supabase
    .from('resource_links')
    .insert({ instructor_id: instructorId, title, url, niche, description: description || null })
    .select()
    .single()

  if (error) return { link: null, error: error.message }
  return { link: data as ResourceLink, error: null }
}

// -------------------------------------------------------
// Update a resource link (instructor)
// -------------------------------------------------------
export async function updateResourceLink(
  linkId: string,
  updates: Partial<Pick<ResourceLink, 'title' | 'url' | 'description' | 'niche' | 'position'>>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('resource_links')
    .update(updates)
    .eq('id', linkId)

  if (error) return { error: error.message }
  return { error: null }
}

// -------------------------------------------------------
// Delete a resource link (instructor)
// -------------------------------------------------------
export async function deleteResourceLink(
  linkId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('resource_links')
    .delete()
    .eq('id', linkId)

  if (error) return { error: error.message }
  return { error: null }
}

// -------------------------------------------------------
// Fetch reactions for a set of links (batch)
// -------------------------------------------------------
export async function fetchReactionsForLinks(
  linkIds: string[]
): Promise<LinkReaction[]> {
  if (linkIds.length === 0) return []
  const { data } = await supabase
    .from('link_reactions')
    .select('*')
    .in('link_id', linkIds)

  return (data ?? []) as LinkReaction[]
}

// -------------------------------------------------------
// Toggle reaction (upsert or delete)
// -------------------------------------------------------
export async function toggleReaction(
  linkId: string,
  userId: string,
  emoji: ReactionEmoji
): Promise<{ added: boolean; error: string | null }> {
  // Check if reaction exists
  const { data: existing } = await supabase
    .from('link_reactions')
    .select('id')
    .eq('link_id', linkId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    // Remove
    const { error } = await supabase
      .from('link_reactions')
      .delete()
      .eq('id', existing.id)
    if (error) return { added: false, error: error.message }
    return { added: false, error: null }
  } else {
    // Add
    const { error } = await supabase
      .from('link_reactions')
      .insert({ link_id: linkId, user_id: userId, emoji })
    if (error) return { added: false, error: error.message }
    return { added: true, error: null }
  }
}

// -------------------------------------------------------
// Fetch comments for a link (with user info)
// -------------------------------------------------------
export async function fetchLinkComments(linkId: string): Promise<LinkComment[]> {
  const { data } = await supabase
    .from('link_comments')
    .select('*, users(name, role)')
    .eq('link_id', linkId)
    .order('created_at', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    ...row,
    user_name: row.users?.name ?? 'Anonymous',
    user_role: row.users?.role ?? 'student',
    users: undefined,
  })) as LinkComment[]
}

// -------------------------------------------------------
// Create a comment on a link
// -------------------------------------------------------
export async function createLinkComment(
  linkId: string,
  userId: string,
  content: string
): Promise<{ comment: LinkComment | null; error: string | null }> {
  const { data, error } = await supabase
    .from('link_comments')
    .insert({ link_id: linkId, user_id: userId, content })
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
    } as LinkComment,
    error: null,
  }
}

// -------------------------------------------------------
// Delete a comment
// -------------------------------------------------------
export async function deleteLinkComment(
  commentId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('link_comments')
    .delete()
    .eq('id', commentId)

  if (error) return { error: error.message }
  return { error: null }
}
