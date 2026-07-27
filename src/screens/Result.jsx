const PASS_LINE = 60

export default function Result({ results, onRetry, onHome }) {
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
          <strong>{passed ? '합격선 통과!' : '합격선 미달'}</strong>
          <p>합격 기준 {PASS_LINE}점 · 이번 코스 {score}점</p>
        </div>
      </div>

      {wrongCount > 0 ? (
        <section className="card note-card">
          틀린 <strong>{wrongCount}문항</strong>을 오답노트에 저장했어요. 복습에서
          다시 맞히면 목록에서 자동으로 빠져요.
        </section>
      ) : (
        <section className="card note-card">
          전부 맞혔어요. 오답노트에 추가된 문항이 없어요.
        </section>
      )}

      <div className="menu-list">
        <button className="btn-primary" onClick={onRetry}>
          한 코스 더 달리기
        </button>
        <button className="btn-secondary center" onClick={onHome}>
          홈으로
        </button>
      </div>
    </div>
  )
}
