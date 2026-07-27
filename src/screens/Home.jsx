import RoadProgress from '../components/RoadProgress.jsx'
import { SECTIONS } from './Practical.jsx'
import { MIN_ATTEMPTS, weakAreas } from '../lib/areas.js'
import bank from '../data/bank.json'

const PRACTICAL_TOTAL = SECTIONS.reduce((n, s) => n + s.items.length, 0)

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'text', label: '문장형' },
  { id: 'img', label: '이미지형' },
]

const MENU = [
  { id: 'review', icon: '📝', label: '오답노트 복습' },
  { id: 'areas', icon: '🎯', label: '영역별 학습' },
  { id: 'practical', icon: '🚙', label: '실기 체크리스트' },
  { id: 'mock', icon: '⏱️', label: '실전 모의고사', note: '40문항 · 40분' },
]

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Home({ progress, filter, onFilterChange, onNavigate }) {
  const now = new Date()
  const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS[now.getDay()]}요일`
  const accuracy =
    progress.total > 0
      ? Math.round((progress.correct / progress.total) * 100)
      : 0
  const conquered = progress.solvedIds.length
  const conqueredPct = Math.round((conquered / bank.length) * 100)
  const practicalDone = progress.practicalDone.length
  const weak = weakAreas(progress, 3)
  const attemptCount = Object.values(progress.attempts ?? {}).reduce(
    (n, r) => n + r.n,
    0,
  )

  return (
    <div className="home">
      <section className="card hero">
        <span className="today">● {dateLabel}</span>
        <h1 className="hero-title">
          오늘의 코스,
          <br />
          <span className="grad">출발할까요?</span>
        </h1>
        <p className="hero-sub">랜덤 10문항으로 하루 한 코스를 완주해요.</p>
        <div className="filter-row" role="group" aria-label="유형 필터">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`chip ${filter === f.id ? 'active' : ''}`}
              onClick={() => onFilterChange(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => onNavigate('quiz')}>
          오늘의 퀴즈 시작 →
        </button>
      </section>

      <section className="stats" aria-label="학습 통계">
        <div className="stat s1">
          <div className="value">{progress.total.toLocaleString()}</div>
          <div className="label">푼 문제</div>
        </div>
        <div className="stat s2">
          <div className="value">{accuracy}%</div>
          <div className="label">정답률</div>
        </div>
        <div className="stat s3">
          <div className="value">{progress.wrongIds.length}</div>
          <div className="label">오답노트</div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          문제은행 정복률
          <span className="sub">전체 {bank.length.toLocaleString()}문항</span>
        </div>
        <div className="pct-big">
          {conqueredPct}
          <span>%</span>
        </div>
        <RoadProgress current={conquered} total={bank.length} />
      </section>

      <section className="card">
        <div className="section-title">
          취약 영역
          <span className="sub">오답률 높은 순</span>
        </div>
        {weak.length > 0 ? (
          <div className="weak-list">
            {weak.map((a) => (
              <button
                key={a.code}
                className="weak-row"
                onClick={() => onNavigate({ screen: 'area', code: a.code })}
              >
                <span className="area-ico">{a.icon}</span>
                <span className="area-main">
                  <span className="area-name">{a.name}</span>
                  <span className="area-bar">
                    <span
                      className="area-fill"
                      style={{ width: `${Math.max(3, a.rate * 100)}%` }}
                    />
                  </span>
                </span>
                <span className="weak-rate">{Math.round(a.rate * 100)}%</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="weak-empty">
            {attemptCount === 0
              ? '문제를 풀면 어느 영역에 약한지 알려드릴게요.'
              : `조금 더 풀어야 해요. 영역마다 ${MIN_ATTEMPTS}회 이상 풀면 오답률이 표시됩니다.`}
          </p>
        )}
      </section>

      <nav className="menu-list">
        {MENU.map((m) => (
          <button
            key={m.id}
            className="btn-secondary"
            onClick={() => onNavigate(m.id)}
          >
            <span className="left">
              <span className="ico">{m.icon}</span>
              {m.label}
              {m.id === 'review' && progress.wrongIds.length > 0 && (
                <span className="badge">{progress.wrongIds.length}</span>
              )}
              {m.id === 'practical' && practicalDone > 0 && (
                <span className="badge soft">
                  {practicalDone}/{PRACTICAL_TOTAL}
                </span>
              )}
            </span>
            {m.note ? <span className="note">{m.note}</span> : <span className="chev">›</span>}
          </button>
        ))}
      </nav>

      <footer className="footer">
        문항 출처 — 도로교통공단 학과시험 문제은행(2026.3.9 시행)
        <br />
        법령·벌점 수치는 2026.3.9 시행 기준이며 개정될 수 있습니다.
      </footer>
    </div>
  )
}
