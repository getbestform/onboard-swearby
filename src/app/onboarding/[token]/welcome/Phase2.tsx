export function Phase2({ name }: { name: string }) {
  return (
    <h1 className="font-sans font-medium tracking-tight text-center" style={{ fontSize: '38px', lineHeight: '120%' }}>
      <span className="text-white">{"Here's why"}</span>
      <br />
      <span style={{ color: '#BDA763' }}>{name}</span>
      <span className="text-white"> sent you.</span>
    </h1>
  )
}
