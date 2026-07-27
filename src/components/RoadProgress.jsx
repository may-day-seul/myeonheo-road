export default function RoadProgress({ current, total }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0
  return (
    <div className="road-progress">
      <div className="road">
        <div className="fill" style={{ width: `${pct}%` }} />
        <div className="center-line" />
        <span className="car" style={{ left: `${Math.max(5, pct)}%` }}>
          🚗
        </span>
      </div>
      <span className="count">
        <strong>{current.toLocaleString()}</strong>/{total.toLocaleString()}
      </span>
    </div>
  )
}
