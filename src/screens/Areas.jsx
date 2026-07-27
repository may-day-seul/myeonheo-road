import { MIN_ATTEMPTS, areaStats } from '../lib/areas.js'

export default function Areas({ progress, onStart, onBack }) {
  const stats = areaStats(progress).sort(
    (x, y) => Number(y.ready) - Number(x.ready) || y.rate - x.rate,
  )
  const studied = stats.filter((a) => a.n > 0).length

  return (
    <div className="areas">
      <div className="quiz-bar">
        <button className="icon-btn" onClick={onBack} aria-label="뒤로">
          ←
        </button>
        <div className="quiz-track">
          <div
            className="quiz-track-fill"
            style={{ width: `${(studied / stats.length) * 100}%` }}
          />
        </div>
        <span className="quiz-count">
          <strong>{studied}</strong>/{stats.length}
        </span>
      </div>

      <div className="practical-head">
        <h1 className="hero-title">영역별 학습</h1>
        <p className="hero-sub">
          오답률이 높은 영역부터 집중해서 풀어보세요. 탭하면 그 영역만 10문항
          출제됩니다.
        </p>
      </div>

      <div className="area-list">
        {stats.map((a) => (
          <button
            key={a.code}
            className={`area-row ${a.ready ? '' : 'dim'}`}
            onClick={() => onStart(a.code)}
          >
            <span className="area-ico">{a.icon}</span>
            <span className="area-main">
              <span className="area-name">
                {a.name}
                {a.ready && a.rate >= 0.4 && (
                  <span className="area-flag">취약</span>
                )}
              </span>
              <span className="area-bar">
                <span
                  className={`area-fill ${a.ready ? '' : 'muted'}`}
                  style={{ width: `${Math.max(3, a.rate * 100)}%` }}
                />
              </span>
              <span className="area-sub">
                {a.ready
                  ? `오답률 ${Math.round(a.rate * 100)}% · ${a.w}/${a.n}회 오답`
                  : `${a.n}회 풀었어요 · ${MIN_ATTEMPTS}회부터 오답률 표시`}
                {' · '}
                {a.solved}/{a.total}문항
              </span>
            </span>
            <span className="chev">›</span>
          </button>
        ))}
      </div>

      <p className="mock-note">
        영역 구분은 문항의 지문·해설 어휘로 <strong>추정 분류</strong>한
        것입니다. 공단이 공식 분류를 제공하지 않아 일부 문항은 다르게 묶일 수
        있어요.
      </p>

      <button className="btn-secondary center" onClick={onBack}>
        홈으로
      </button>
    </div>
  )
}
