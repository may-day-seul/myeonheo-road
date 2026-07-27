// 아직 구현되지 않은 화면의 공통 자리표시자
export default function Placeholder({ icon, title, onBack }) {
  return (
    <div className="placeholder">
      <div className="big">{icon}</div>
      <div>
        <strong style={{ color: 'var(--text)' }}>{title}</strong>
        <br />
        준비 중인 화면이에요.
      </div>
      <button className="btn-back" onClick={onBack}>
        ← 홈으로
      </button>
    </div>
  )
}
