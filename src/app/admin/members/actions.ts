'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as string, user: null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()
  if (profile?.role !== 'admin') return { error: 'Not authorized' as string, user: null }
  return { error: null, user }
}

export async function createMember(formData: FormData) {
  const { error: authErr } = await verifyAdmin()
  if (authErr) return { error: authErr }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string

  const adminClient = createAdminClient()

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    email_confirm: true,
  })

  if (error) return { error: error.message }

  await adminClient
    .from('profiles')
    .update({ full_name })
    .eq('id', data.user.id)

  return { success: true, userId: data.user.id }
}

export async function updateMember(formData: FormData) {
  const { error: authErr } = await verifyAdmin()
  if (authErr) return { error: authErr }

  const userId = formData.get('user_id') as string
  const full_name = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string | null

  const adminClient = createAdminClient()

  // Update auth user (email + optional password)
  const authUpdate: { email: string; password?: string } = { email }
  if (password && password.trim().length >= 6) authUpdate.password = password

  const { error: authUpdateErr } = await adminClient.auth.admin.updateUserById(userId, authUpdate)
  if (authUpdateErr) return { error: authUpdateErr.message }

  // Update profile
  const { error: profileErr } = await adminClient
    .from('profiles')
    .update({ full_name, email })
    .eq('id', userId)

  if (profileErr) return { error: profileErr.message }

  return { success: true }
}
