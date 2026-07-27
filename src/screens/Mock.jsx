import { useEffect, useRef, useState } from 'react'
import Lightbox from '../components/Lightbox.jsx'
import { QuestionCard, Options } from '../components/QuestionBody.jsx'
import { MOCK_MINUTES } from '../lib/quiz.js'

const fmt = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 실제 시험처럼 문항별 즉시 채점 없이 40문항을 모두 푼 뒤 제출한다.
export default function Mock({ questions, onSubmit, onExit }) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState(() => new Map())
  const [left, setLeft] = useState(MOCK_MINUTES * 60)
  const [zoom, setZoom] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const submitRef = useRef(null)
  submitRef.current = (timedOut) => onSubmit(answers, timedOut)

  useEffect(() => {
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t)
          submitRef.current(true) // 시간 종료 시 자동 제출
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const q = questions[idx]
  const multi = q.a.length === 2
  const selected = answers.get(q.i) ?? []
  const answeredCount = [...answers.values()].filter((v) => v.length > 0).length

  const pick = (n) => {
    setAnswers((prev) => {
      const next = new Map(prev)
      const cur = next.get(q.i) ?? []
      if (multi) {
        next.set(
          q.i,
          cur.includes(n)
            ? cur.filter((v) => v !== n)
            : cur.length >= 2
              ? cur
              : [...cur, n],
        )
      } else {
        next.set(q.i, cur[0] === n ? [] : [n])
      }
      return next
    })
  }

  const go = (i) => {
    setIdx(Math.max(0, Math.min(questions.length - 1, i)))
    setSheet(false)
  }

  const urgent = left <= 5 * 60

  return (
    <div className="quiz mock">
      <div className="quiz-bar">
        <button className="icon-btn" onClick={onExit} aria-label="나가기">
          ✕
        </button>
        <div className="quiz-track">
          <div
            className="quiz-track-fill"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
        <span className={`timer ${urgent ? 'urgent' : ''}`}>⏱ {fmt(left)}</span>
      </div>

      <div className="quiz-meta">
        <span className="tag">모의고사</span>
        <span className="tag ghost">#{q.i}</span>
        {multi && <span className="tag multi">2개 선택</span>}
        <button className="tag sheet-btn" onClick={() => setSheet(true)}>
          답안지 {answeredCount}/{questions.length}
        </button>
      </div>

      <QuestionCard q={q} onZoom={() => setZoom(true)} />
      <Options q={q} selected={selected} onPick={pick} />

      <div className="mock-nav">
        <button
          className="btn-secondary center"
          disabled={idx === 0}
          onClick={() => go(idx - 1)}
        >
          ← 이전
        </button>
        {idx + 1 < questions.length ? (
          <button className="btn-secondary center" onClick={() => go(idx + 1)}>
            다음 →
          </button>
        ) : (
          <button className="btn-primary" onClick={() => setConfirm(true)}>
            제출하기
          </button>
        )}
      </div>

      <p className="mock-note">
        추정 배점(문장형 2점·이미지형 3점)으로 채점합니다. 공단 공식 배점이
        아니므로 실제 점수와 다를 수 있어요.
      </p>

      {sheet && (
        <div className="sheet" role="dialog" aria-modal="true">
          <div className="sheet-inner">
            <div className="sheet-head">
              <strong>답안지</strong>
              <button className="icon-btn" onClick={() => setSheet(false)}>
                ✕
              </button>
            </div>
            <div className="sheet-grid">
              {questions.map((qq, i) => {
                const done = (answers.get(qq.i) ?? []).length > 0
                return (
                  <button
                    key={qq.i}
                    className={`cell ${done ? 'done' : ''} ${i === idx ? 'cur' : ''}`}
                    onClick={() => go(i)}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <button className="btn-primary" onClick={() => setConfirm(true)}>
              지금 제출하기
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <div className="sheet" role="dialog" aria-modal="true">
          <div className="sheet-inner">
            <div className="sheet-head">
              <strong>제출할까요?</strong>
            </div>
            <p className="sheet-body">
              {answeredCount < questions.length
                ? `아직 ${questions.length - answeredCount}문항이 비어 있어요. 빈 문항은 오답 처리됩니다.`
                : '40문항을 모두 풀었어요.'}
            </p>
            <button className="btn-primary" onClick={() => onSubmit(answers, false)}>
              제출
            </button>
            <button
              className="btn-secondary center"
              onClick={() => setConfirm(false)}
            >
              더 풀기
            </button>
          </div>
        </div>
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
