export function Phase1({ name }: { name: string }) {
  return (
    <h1 className="font-sans font-medium tracking-tight text-center" style={{ fontSize: '38px', lineHeight: '120%' }}>
      <span className="text-white">Referred by </span>
      <span style={{ color: '#BDA763' }}>{name}</span>
      <br />
      <span className="text-white">founding partner.</span>
    </h1>
  )
}
