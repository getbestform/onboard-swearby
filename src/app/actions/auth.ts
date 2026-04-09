'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type AuthState = { error: string } | undefined

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  // Role is injected into the JWT by custom_access_token_hook (same pattern as verti-v2)
  let role = 'none'
  const token = data.session?.access_token
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      role = payload.user_role ?? 'none'
    } catch {
      // JWT decode failed — fall through with 'none'
    }
  }

  if (role !== 'verti_admin') {
    await supabase.auth.signOut()
    return { error: 'Access denied.' }
  }

  redirect('/invite')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/login')
}
