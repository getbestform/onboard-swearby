export function Phase1({ name }: { name: string }) {
  return (
    <h1 className="font-plus-jakarta font-medium text-center md:text-left text-4xl md:text-8xl leading-[1.2]">
      <span className="text-white">Referred by </span>
      <span style={{ color: '#BDA763' }}>{name}</span>
      <span className="text-white"> founding partner.</span>
    </h1>
  )
}
