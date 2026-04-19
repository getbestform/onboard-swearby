'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-text-primary mb-2">Clinic onboarding</h1>
        <p className="text-text-secondary text-sm mb-8">
          Sign in with the email and password from your invite to continue your clinic&apos;s SwearBy onboarding.
        </p>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-text-primary font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="clinic@example.com"
              className="h-11 rounded-xl border border-border bg-bg-card px-4 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-text-primary font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 rounded-xl border border-border bg-bg-card px-4 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-danger">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-11 rounded-xl bg-primary text-cream text-sm font-medium transition-opacity disabled:opacity-60 hover:opacity-90"
          >
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
