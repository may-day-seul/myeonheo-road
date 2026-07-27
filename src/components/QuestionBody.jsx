import { optionCount } from '../lib/quiz.js'

export const CIRCLED = ['①', '②', '③', '④', '⑤']

// 문항 지문. 이미지형은 보기 텍스트가 카드 안에 있어 따로 렌더링하지 않는다.
export function QuestionCard({ q, onZoom }) {
  return (
    <section className="card q-card">
      {q.t === 'text' ? (
        <p className="q-text">{q.q}</p>
      ) : (
        <>
          <button
            className="q-img"
            onClick={onZoom}
            aria-label="문제 이미지 확대"
          >
            <img src={`/q/${q.i}.jpg`} alt={`${q.i}번 문항`} loading="lazy" />
          </button>
          <span className="q-img-hint">⤢ 이미지를 탭하면 크게 볼 수 있어요</span>
        </>
      )}
    </section>
  )
}

// graded가 false면 채점 색상 없이 선택 상태만 보여준다(모의고사).
export function Options({ q, selected, graded = false, onPick }) {
  const n = optionCount(q)

  const cls = (k) => {
    if (!graded) return selected.includes(k) ? 'opt selected' : 'opt'
    if (q.a.includes(k)) return 'opt correct'
    if (selected.includes(k)) return 'opt wrong'
    return 'opt muted'
  }

  return (
    <div className="opts">
      {Array.from({ length: n }, (_, k) => k + 1).map((k) => (
        <button
          key={k}
          className={cls(k)}
          onClick={() => onPick(k)}
          disabled={graded}
        >
          <span className="opt-num">{CIRCLED[k - 1]}</span>
          {q.t === 'text' && <span className="opt-text">{q.c[k - 1]}</span>}
          {graded && q.a.includes(k) && <span className="opt-mark">✓</span>}
          {graded && !q.a.includes(k) && selected.includes(k) && (
            <span className="opt-mark">✕</span>
          )}
        </button>
      ))}
    </div>
  )
}
