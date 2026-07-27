const PASS_LINE = 60

export default function Result({ results, onReview, onRetry, onHome }) {
  const total = results.length
  const correct = results.filter((r) => r.correct).length
  const score = total > 0 ? Math.round((correct / total) * 100) : 0
  const passed = score >= PASS_LINE
  const wrongCount = total - correct

  return (
    <div className="result">
      <div className={`score-ring ${passed ? 'pass' : 'fail'}`}>
        <div className="score-num">
          {score}
          <span>점</span>
        </div>
        <div className="score-sub">
          {correct}/{total} 정답
        </div>
      </div>

      <div className={`verdict big ${passed ? 'ok' : 'no'}`}>
        <span className="verdict-ico">{passed ? '🏁' : '🚧'}</span>
        <div>
          <strong>{passed ? '오늘도 땄다!' : '조금만 더'}</strong>
          <p>합격 기준 {PASS_LINE}점 · 이번 회차 {score}점</p>
        </div>
      </div>

      {wrongCount > 0 ? (
        <section className="card note-card">
          틀린 <strong>{wrongCount}문항</strong>은 오답노트에 넣어뒀어요. 복습에서
          다시 맞히면 목록에서 빠집니다.
        </section>
      ) : (
        <section className="card note-card">
          전부 맞혔어요. 오답노트에 넣을 문항이 없습니다.
        </section>
      )}

      <div className="menu-list">
        {wrongCount > 0 && (
          <button className="btn-secondary center review-btn" onClick={onReview}>
            틀린 {wrongCount}문항 다시보기
          </button>
        )}
        <button className="btn-primary" onClick={onRetry}>
          한 판 더
        </button>
        <button className="btn-secondary center" onClick={onHome}>
          홈으로
        </button>
      </div>
    </div>
  )
}
