// 신호등 스트릭: 1일 이상 빨강, 3일 이상 노랑, 7일 이상 초록 점등
export default function Header({ streak }) {
  return (
    <header className="header">
      <div className="logo">
        <span className="mark">🛣️</span>
        {/* 헤더가 flex라 낱개 텍스트로 두면 단어 사이에도 gap이 붙는다 */}
        <span className="wordmark">
          오늘도 <span className="accent">딴다</span>
        </span>
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
