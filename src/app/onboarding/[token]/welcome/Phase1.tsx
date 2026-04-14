export function Phase1({ name }: { name: string }) {
  return (
    <h1 className="font-sans font-bold leading-[1.08] tracking-tight" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
      <span className="text-white">Referred by </span>
      <span style={{ color: '#BDA763' }}>{name}</span>
      <br />
      <span className="text-white">founding partner.</span>
    </h1>
  )
}
