'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl text-primary mb-2">Welcome back</h1>
        <p className="text-secondary text-sm mb-8">Sign in to your account</p>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-primary font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 rounded-xl border border-secondary/30 bg-white px-4 text-sm text-primary placeholder:text-secondary/60 outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-primary font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 rounded-xl border border-secondary/30 bg-white px-4 text-sm text-primary placeholder:text-secondary/60 outline-none focus:border-primary transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-tertiary">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-11 rounded-xl bg-primary text-neutral text-sm font-medium transition-opacity disabled:opacity-60 hover:opacity-90"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
