export default function RoadProgress({ current, total }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0
  return (
    <div className="road-progress">
      <div className="road">
        <div className="center-line" />
        <span className="car" style={{ left: `${Math.max(4, pct)}%` }}>
          🚗
        </span>
      </div>
      <span className="count">
        {current.toLocaleString()}/{total.toLocaleString()}
      </span>
    </div>
  )
}
