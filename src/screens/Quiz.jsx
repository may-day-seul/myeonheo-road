import { useState } from 'react'
import Lightbox from '../components/Lightbox.jsx'
import {
  CIRCLED,
  QuestionCard,
  Options,
} from '../components/QuestionBody.jsx'
import { isCorrect } from '../lib/quiz.js'

const NO_EXPLANATION = '해설이 제공되지 않는 문항입니다.'

export default function Quiz({ questions, title, onFinish, onExit }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState([])
  const [graded, setGraded] = useState(false)
  const [results, setResults] = useState([])
  const [zoom, setZoom] = useState(false)

  const q = questions[idx]
  const multi = q.a.length === 2
  const isLast = idx + 1 >= questions.length

  const commit = (sel) => {
    setGraded(true)
    setResults((prev) => [...prev, { id: q.i, correct: isCorrect(q, sel) }])
  }

  const pick = (n) => {
    if (graded) return
    if (!multi) {
      setSelected([n])
      commit([n])
      return
    }
    setSelected((prev) =>
      prev.includes(n)
        ? prev.filter((v) => v !== n)
        : prev.length >= 2
          ? prev
          : [...prev, n],
    )
  }

  const next = () => {
    if (isLast) {
      onFinish(results)
      return
    }
    setIdx(idx + 1)
    setSelected([])
    setGraded(false)
  }

  const wasCorrect = graded && results[results.length - 1]?.correct

  return (
    <div className="quiz">
      <div className="quiz-bar">
        <button className="icon-btn" onClick={onExit} aria-label="나가기">
          ✕
        </button>
        <div className="quiz-track">
          <div
            className="quiz-track-fill"
            style={{
              width: `${((idx + (graded ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>
        <span className="quiz-count">
          <strong>{idx + 1}</strong>/{questions.length}
        </span>
      </div>

      <div className="quiz-meta">
        <span className="tag">{title}</span>
        <span className="tag ghost">#{q.i}</span>
        {multi && <span className="tag multi">2개 선택</span>}
      </div>

      <QuestionCard q={q} onZoom={() => setZoom(true)} />
      <Options q={q} selected={selected} graded={graded} onPick={pick} />

      {multi && !graded && (
        <button
          className="btn-primary"
          disabled={selected.length !== 2}
          onClick={() => commit(selected)}
        >
          정답 확인 ({selected.length}/2)
        </button>
      )}

      {graded && (
        <>
          <div className={`verdict ${wasCorrect ? 'ok' : 'no'}`}>
            <span className="verdict-ico">{wasCorrect ? '🎉' : '💥'}</span>
            <div>
              <strong>{wasCorrect ? '정답이에요!' : '아쉬워요'}</strong>
              <p>
                정답 {q.a.map((n) => CIRCLED[n - 1]).join(' ')}
                {!wasCorrect && ' · 오답노트에 저장돼요'}
              </p>
            </div>
          </div>

          <section className="card explain">
            <div className="explain-head">해설</div>
            <p className={q.e?.trim() ? '' : 'empty'}>
              {q.e?.trim() || NO_EXPLANATION}
            </p>
          </section>

          <button className="btn-primary" onClick={next}>
            {isLast ? '결과 보기 →' : '다음 문제 →'}
          </button>
        </>
      )}

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
