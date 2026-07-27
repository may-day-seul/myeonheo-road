import { useState } from 'react'
import Lightbox from '../components/Lightbox.jsx'
import { CIRCLED, QuestionCard, Options } from '../components/QuestionBody.jsx'

const NO_EXPLANATION = '해설이 제공되지 않는 문항입니다.'

// 틀린 문항을 한 개씩 넘겨보며 정답과 해설을 확인한다.
// 목록을 통째로 펼치면 모의고사 40문항에서는 너무 길어져 퀴즈와 같은 방식으로 쪽을 넘긴다.
export default function WrongReview({ items, onBack }) {
  const [idx, setIdx] = useState(0)
  const [zoom, setZoom] = useState(false)

  const { q, selected } = items[idx]
  const isLast = idx + 1 >= items.length

  const go = (i) => {
    setIdx(Math.max(0, Math.min(items.length - 1, i)))
    setZoom(false)
  }

  return (
    <div className="quiz">
      <div className="quiz-bar">
        <button className="icon-btn" onClick={onBack} aria-label="닫기">
          ✕
        </button>
        <div className="quiz-track">
          <div
            className="quiz-track-fill"
            style={{ width: `${((idx + 1) / items.length) * 100}%` }}
          />
        </div>
        <span className="quiz-count">
          <strong>{idx + 1}</strong>/{items.length}
        </span>
      </div>

      <div className="quiz-meta">
        <span className="tag">오답 다시보기</span>
        <span className="tag ghost">#{q.i}</span>
        {q.a.length === 2 && <span className="tag multi">2개 선택</span>}
      </div>

      <QuestionCard q={q} onZoom={() => setZoom(true)} />
      <Options q={q} selected={selected} graded onPick={() => {}} />

      <div className="verdict no">
        <span className="verdict-ico">💥</span>
        <div>
          <strong>
            정답 {q.a.map((n) => CIRCLED[n - 1]).join(' ')}
          </strong>
          <p>
            {selected.length
              ? `내 선택 ${selected.map((n) => CIRCLED[n - 1]).join(' ')}`
              : '응답하지 않았어요'}
          </p>
        </div>
      </div>

      <section className="card explain">
        <div className="explain-head">해설</div>
        <p className={q.e?.trim() ? '' : 'empty'}>
          {q.e?.trim() || NO_EXPLANATION}
        </p>
      </section>

      <div className="mock-nav">
        <button
          className="btn-secondary center"
          disabled={idx === 0}
          onClick={() => go(idx - 1)}
        >
          ← 이전
        </button>
        {isLast ? (
          <button className="btn-primary" onClick={onBack}>
            다 봤어요
          </button>
        ) : (
          <button className="btn-secondary center" onClick={() => go(idx + 1)}>
            다음 →
          </button>
        )}
      </div>

      {zoom && (
        <Lightbox
          src={`/q/${q.i}.jpg`}
          alt={`${q.i}번 문항 확대`}
          onClose={() => setZoom(false)}
        />
      )}
    </div>
  )
}
