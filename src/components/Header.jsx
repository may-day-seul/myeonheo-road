// 신호등 스트릭: 1일 이상 빨강, 3일 이상 노랑, 7일 이상 초록 점등
export default function Header({ streak }) {
  return (
    <header className="header">
      <div className="logo">
        <span className="mark">🛣️</span>
        면허로드
      </div>
      <div className="streak-pill" aria-label={`연속 학습 ${streak}일`}>
        <span className={`lamp red ${streak >= 1 ? 'on' : ''}`} />
        <span className={`lamp yellow ${streak >= 3 ? 'on' : ''}`} />
        <span className={`lamp green ${streak >= 7 ? 'on' : ''}`} />
        <span className="days">{streak}일</span>
      </div>
    </header>
  )
}
