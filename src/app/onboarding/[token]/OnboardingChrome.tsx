'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type OnboardingChromeValue = {
  headerVisible: boolean
  setHeaderVisible: (visible: boolean) => void
}

const OnboardingChromeContext = createContext<OnboardingChromeValue | null>(null)

export function OnboardingChromeProvider({ children }: { children: ReactNode }) {
  const [headerVisible, setHeaderVisibleState] = useState(true)
  const setHeaderVisible = useCallback((visible: boolean) => {
    setHeaderVisibleState(visible)
  }, [])
  const value = useMemo(
    () => ({ headerVisible, setHeaderVisible }),
    [headerVisible, setHeaderVisible],
  )
  return (
    <OnboardingChromeContext.Provider value={value}>
      {children}
    </OnboardingChromeContext.Provider>
  )
}

export function OnboardingHeader() {
  const { headerVisible } = useOnboardingChrome()
  if (!headerVisible) return null
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex"
      style={{ backgroundColor: 'inherit' }}
    >
      <div className="mx-auto max-w-[1200px] w-full px-8 md:px-5 py-8 md:py-10 flex justify-center md:justify-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          id="onboarding-logo"
          src="/swearby-logo.svg"
          alt="Swearby"
          className="h-5 md:h-6 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>
    </header>
  )
}

export function useOnboardingChrome() {
  const ctx = useContext(OnboardingChromeContext)
  if (!ctx) {
    throw new Error('useOnboardingChrome must be used within OnboardingChromeProvider')
  }
  return ctx
}
