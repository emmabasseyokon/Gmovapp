'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createMember(formData: FormData) {
  // Verify the caller is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (profile?.role !== 'admin') return { error: 'Not authorized' }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string

  const adminClient = createAdminClient()

  // Create the auth user server-side — does not affect the admin's session
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    email_confirm: true, // skip email confirmation
  })

  if (error) return { error: error.message }

  // Profile is auto-created by the DB trigger, but update full_name to be safe
  await adminClient
    .from('profiles')
    .update({ full_name })
    .eq('id', data.user.id)

  return { success: true, userId: data.user.id }
}
