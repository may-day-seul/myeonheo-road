import { PASS_SCORE, SCORE_WEIGHTS, isCorrect, weightOf } from '../lib/quiz.js'

export default function MockResult({
  questions,
  answers,
  summary,
  timedOut,
  onReview,
  onRetry,
  onHome,
}) {
  const { earned, total, score } = summary
  const passed = score >= PASS_SCORE

  const solved = questions.filter((q) => (answers.get(q.i) ?? []).length > 0)
  const correct = questions.filter((q) => isCorrect(q, answers.get(q.i) ?? []))
  const blank = questions.length - solved.length

  const byType = ['text', 'img'].map((t) => {
    const qs = questions.filter((q) => q.t === t)
    const ok = qs.filter((q) => isCorrect(q, answers.get(q.i) ?? []))
    return {
      t,
      label: t === 'text' ? '문장형' : '이미지형',
      count: qs.length,
      ok: ok.length,
      pts: ok.reduce((s, q) => s + weightOf(q), 0),
      max: qs.reduce((s, q) => s + weightOf(q), 0),
    }
  })

  return (
    <div className="result">
      <div className={`score-ring ${passed ? 'pass' : 'fail'}`}>
        <div className="score-num">
          {score}
          <span>점</span>
        </div>
        <div className="score-sub">
          {correct.length}/{questions.length} 정답 · {earned}/{total}점 환산
        </div>
      </div>

      <div className={`verdict big ${passed ? 'ok' : 'no'}`}>
        <span className="verdict-ico">{passed ? '🏁' : '🚧'}</span>
        <div>
          <strong>{passed ? '오늘도 땄다!' : '조금만 더'}</strong>
          <p>
            합격 기준 {PASS_SCORE}점
            {timedOut && ' · 시간 종료로 자동 제출됐어요'}
            {blank > 0 && ` · 미응답 ${blank}문항`}
          </p>
        </div>
      </div>

      <section className="card">
        <div className="section-title">
          유형별 결과
          <span className="sub">
            추정 배점 문장형 {SCORE_WEIGHTS.text}점 · 이미지형{' '}
            {SCORE_WEIGHTS.img}점
          </span>
        </div>
        <div className="type-rows">
          {byType.map((r) => (
            <div className="type-row" key={r.t}>
              <span className="type-name">{r.label}</span>
              <div className="type-bar">
                <div
                  className={`type-fill ${r.t}`}
                  style={{ width: `${r.count ? (r.ok / r.count) * 100 : 0}%` }}
                />
              </div>
              <span className="type-val">
                {r.ok}/{r.count}
                <em>{r.pts}점</em>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card note-card">
        배점은 <strong>추정치</strong>입니다. 공단이 공식 배점표를 공개하지 않아
        문장형 {SCORE_WEIGHTS.text}점·이미지형 {SCORE_WEIGHTS.img}점으로 근사했고,
        실제 시험 점수와 다를 수 있어요. 틀린 문항은 오답노트에 넣어뒀습니다.
      </section>

      <div className="menu-list">
        {correct.length < questions.length && (
          <button className="btn-secondary center review-btn" onClick={onReview}>
            틀린 {questions.length - correct.length}문항 다시보기
          </button>
        )}
        <button className="btn-primary" onClick={onRetry}>
          한 판 더 응시
        </button>
        <button className="btn-secondary center" onClick={onHome}>
          홈으로
        </button>
      </div>
    </div>
  )
}
