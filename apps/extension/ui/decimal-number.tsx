const zeroPad = (num: number, places: number) =>
  String(num).padStart(places, "0")

export function DecimalNumber({
  value,
  compact
}: {
  value: number
  compact?: boolean
}) {
  const showCompact = compact && value >= 1000
  const baseVal = showCompact ? value / 1000 : value
  const integer = Math.floor(baseVal)
  const decimal = baseVal - integer
  return (
    <span>
      {integer.toLocaleString("en")}
      {(!showCompact || integer < 10) && (
        <small style={{ opacity: 0.75 }}>
          .{zeroPad(Math.floor(decimal * 100), 2)}
        </small>
      )}
      {showCompact && <small>K</small>}
    </span>
  )
}
