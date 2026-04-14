'use client'

import { Icon } from './Icon'

export function CompleteStep() {
  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center [font-family:var(--font-plus-jakarta)]"
      style={{ background: 'linear-gradient(145deg, #022616 0%, #1a3c2a 100%)' }}>
      <div className="text-center px-8">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
          <Icon name="check" className="w-7 h-7 text-white" />
        </div>
        <p className="text-[#a9cfb6] tracking-[0.4em] font-serif text-xs uppercase mb-4">Enrollment Confirmed</p>
        <h1 className="text-white font-serif text-4xl md:text-5xl leading-tight mb-6">You&apos;re In</h1>
        <p className="text-[#82a78f] text-sm max-w-sm mx-auto leading-relaxed">
          Your founding partner position has been secured. Our clinical team will be in touch within 24 hours.
        </p>
      </div>
    </div>
  )
}
