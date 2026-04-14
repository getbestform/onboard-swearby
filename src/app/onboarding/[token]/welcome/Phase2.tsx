export function Phase2({ name }: { name: string }) {
  return (
    <h1 className="font-sans font-bold leading-[1.08] tracking-tight" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
      <span className="text-white">{"Here's why"}</span>
      <br />
      <span style={{ color: '#BDA763' }}>{name}</span>
      <span className="text-white"> sent you.</span>
    </h1>
  )
}
