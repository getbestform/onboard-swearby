import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f4] text-[#1b1c19] px-8">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#424843]/60 mb-4">404</p>
      <h1 className="font-serif text-4xl text-[#1A3C2A] mb-3">Page Not Found</h1>
      <p className="text-sm text-[#424843] mb-10">The page you're looking for doesn't exist or has been moved.</p>
      <Link
        href="/"
        className="text-[10px] uppercase tracking-widest text-[#1A3C2A] border-b border-[#1A3C2A]/30 pb-0.5 hover:border-[#1A3C2A] transition-colors"
      >
        Return Home
      </Link>
    </div>
  )
}
