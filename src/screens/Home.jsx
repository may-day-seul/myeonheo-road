import RoadProgress from '../components/RoadProgress.jsx'
import bank from '../data/bank.json'

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'text', label: '문장형만' },
  { id: 'img', label: '이미지형만' },
]

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Home({ progress, filter, onFilterChange, onNavigate }) {
  const now = new Date()
  const dateLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${WEEKDAYS[now.getDay()]})`
  const accuracy =
    progress.total > 0
      ? Math.round((progress.correct / progress.total) * 100)
      : 0

  return (
    <div className="home">
      <section className="card">
        <div className="today">{dateLabel}</div>
        <h1 className="hero-title">오늘의 코스, 출발할까요?</h1>
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
          오늘의 퀴즈 시작
        </button>
      </section>

      <section className="stats" aria-label="학습 통계">
        <div className="stat">
          <div className="value">{progress.total.toLocaleString()}</div>
          <div className="label">푼 문제</div>
        </div>
        <div className="stat">
          <div className="value">{accuracy}%</div>
          <div className="label">정답률</div>
        </div>
        <div className="stat">
          <div className="value">{progress.wrongIds.length}</div>
          <div className="label">오답노트</div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          문제은행 정복률
          <span className="sub">전체 {bank.length.toLocaleString()}문항</span>
        </div>
        <RoadProgress current={progress.solvedIds.length} total={bank.length} />
      </section>

      <nav className="menu-list">
        <button className="btn-secondary" onClick={() => onNavigate('review')}>
          <span className="left">
            📝 오답노트 복습
            {progress.wrongIds.length > 0 && (
              <span className="badge">{progress.wrongIds.length}</span>
            )}
          </span>
          <span className="chev">›</span>
        </button>
        <button
          className="btn-secondary"
          onClick={() => onNavigate('practical')}
        >
          <span className="left">🚙 실기 체크리스트</span>
          <span className="chev">›</span>
        </button>
        <button className="btn-secondary" onClick={() => onNavigate('mock')}>
          <span className="left">⏱️ 실전 모의고사</span>
          <span className="chev">›</span>
        </button>
      </nav>

      <footer className="footer">
        문항 출처 — 도로교통공단 학과시험 문제은행(2026.3.9 시행)
        <br />
        법령·벌점 수치는 2026.3.9 시행 기준이며 개정될 수 있습니다.
      </footer>
    </div>
  )
}
