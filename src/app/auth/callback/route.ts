import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Check if this user already has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, selected_plan')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // First-time OAuth user — create a minimal profile from Google metadata
        const fullName: string = user.user_metadata?.full_name ?? ''
        const nameParts = fullName.trim().split(' ')
        const firstName = nameParts[0] ?? user.email?.split('@')[0] ?? ''
        const lastName  = nameParts.slice(1).join(' ')

        await supabase.from('profiles').insert({
          id:         user.id,
          email:      user.email!,
          first_name: firstName,
          last_name:  lastName,
          selected_plan: 'free',
        })

        // New OAuth user — send them to plan selection
        return NextResponse.redirect(`${origin}/signup/plan`)
      }

      // Returning user — send them to the dashboard (or requested path)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
