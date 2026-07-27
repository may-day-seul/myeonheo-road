import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import PwaPrompts from './components/PwaPrompts.jsx'
import Home from './screens/Home.jsx'
import Quiz from './screens/Quiz.jsx'
import Result from './screens/Result.jsx'
import Mock from './screens/Mock.jsx'
import MockResult from './screens/MockResult.jsx'
import Practical from './screens/Practical.jsx'
import Areas from './screens/Areas.jsx'
import WrongReview from './screens/WrongReview.jsx'
import Placeholder from './screens/Placeholder.jsx'
import {
  load,
  save,
  bumpStreak,
  effectiveStreak,
  addAttempts,
} from './lib/storage.js'
import {
  pickDaily,
  pickReview,
  pickMock,
  pickArea,
  scoreMock,
  isCorrect,
} from './lib/quiz.js'
import { areaName } from './lib/areas.js'
import { loadBank } from './lib/bank.js'

export default function App() {
  const [progress, setProgress] = useState(load)
  const [screen, setScreen] = useState('home')
  const [filter, setFilter] = useState('all')
  const [questions, setQuestions] = useState([])
  const [quizTitle, setQuizTitle] = useState('오늘치 10문항')
  const [results, setResults] = useState([])
  const [mock, setMock] = useState(null)
  const [wrong, setWrong] = useState([])
  // 문제은행은 별도 에셋이라 셸을 먼저 그리고 뒤이어 받아온다.
  const [bankState, setBankState] = useState('loading')

  useEffect(() => {
    let alive = true
    loadBank()
      .then(() => alive && setBankState('ready'))
      .catch(() => alive && setBankState('error'))
    return () => {
      alive = false
    }
  }, [])

  const goHome = () => setScreen('home')

  // 푼 문항을 진행상황에 반영한다. 맞히면 오답노트에서 빠지고, 틀리면 들어간다.
  const record = (entries) => {
    const p = load()
    const solved = new Set(p.solvedIds)
    const wrong = new Set(p.wrongIds)
    for (const r of entries) {
      solved.add(r.id)
      if (r.correct) wrong.delete(r.id)
      else wrong.add(r.id)
    }
    const updated = bumpStreak({
      ...p,
      total: p.total + entries.length,
      correct: p.correct + entries.filter((r) => r.correct).length,
      solvedIds: [...solved],
      wrongIds: [...wrong],
      attempts: addAttempts(p.attempts, entries),
    })
    save(updated)
    setProgress(updated)
    return updated
  }

  const startDaily = () => {
    setQuestions(pickDaily(progress, filter))
    setQuizTitle('오늘치 10문항')
    setScreen('quiz')
  }

  const startReview = () => {
    const qs = pickReview(progress)
    if (qs.length === 0) return setScreen('review-empty')
    setQuestions(qs)
    setQuizTitle('오답노트 복습')
    setScreen('quiz')
  }

  const startMock = () => {
    setQuestions(pickMock())
    setMock(null)
    setScreen('mock')
  }

  const startArea = (code) => {
    setQuestions(pickArea(progress, code))
    setQuizTitle(areaName(code))
    setScreen('quiz')
  }

  // 메뉴는 문자열, 취약 영역 카드는 { screen: 'area', code }를 넘긴다.
  const navigate = (target) => {
    if (typeof target === 'object') return startArea(target.code)
    if (target === 'quiz') return startDaily()
    if (target === 'review') return startReview()
    if (target === 'mock') return startMock()
    setScreen(target)
  }

  const finishQuiz = (quizResults) => {
    record(quizResults)
    setResults(quizResults)
    const byId = new Map(questions.map((q) => [q.i, q]))
    setWrong(
      quizResults
        .filter((r) => !r.correct)
        .map((r) => ({ q: byId.get(r.id), selected: r.selected ?? [] })),
    )
    setScreen('result')
  }

  const submitMock = (answers, timedOut) => {
    record(
      questions.map((q) => ({
        id: q.i,
        correct: isCorrect(q, answers.get(q.i) ?? []),
      })),
    )
    setWrong(
      questions
        .filter((q) => !isCorrect(q, answers.get(q.i) ?? []))
        .map((q) => ({ q, selected: answers.get(q.i) ?? [] })),
    )
    setMock({ answers, timedOut, summary: scoreMock(questions, answers) })
    setScreen('mock-result')
  }

  if (bankState !== 'ready') {
    return (
      <div className="container">
        <PwaPrompts />
        <Header streak={effectiveStreak(progress)} />
        <div className="placeholder">
          {bankState === 'loading' ? (
            <>
              <div className="big">🛣️</div>
              <div>문제은행을 불러오는 중이에요…</div>
            </>
          ) : (
            <>
              <div className="big">⚠️</div>
              <div>
                <strong style={{ color: 'var(--text)' }}>
                  문제를 불러오지 못했어요
                </strong>
                <br />
                네트워크를 확인하고 다시 시도해 주세요.
              </div>
              <button
                className="btn-back"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <PwaPrompts />
      <Header streak={effectiveStreak(progress)} />

      {screen === 'home' && (
        <Home
          progress={progress}
          filter={filter}
          onFilterChange={setFilter}
          onNavigate={navigate}
        />
      )}

      {screen === 'quiz' && (
        <Quiz
          key={questions.map((q) => q.i).join('-')}
          questions={questions}
          title={quizTitle}
          onFinish={finishQuiz}
          onExit={goHome}
        />
      )}

      {screen === 'result' && (
        <Result
          results={results}
          onReview={() => setScreen('wrong-quiz')}
          onRetry={startDaily}
          onHome={goHome}
        />
      )}

      {screen === 'mock' && (
        <Mock
          key={questions.map((q) => q.i).join('-')}
          questions={questions}
          onSubmit={submitMock}
          onExit={goHome}
        />
      )}

      {screen === 'mock-result' && mock && (
        <MockResult
          questions={questions}
          answers={mock.answers}
          summary={mock.summary}
          timedOut={mock.timedOut}
          onReview={() => setScreen('wrong-mock')}
          onRetry={startMock}
          onHome={goHome}
        />
      )}

      {(screen === 'wrong-quiz' || screen === 'wrong-mock') &&
        wrong.length > 0 && (
          <WrongReview
            items={wrong}
            onBack={() =>
              setScreen(screen === 'wrong-quiz' ? 'result' : 'mock-result')
            }
          />
        )}

      {screen === 'areas' && (
        <Areas progress={progress} onStart={startArea} onBack={goHome} />
      )}

      {screen === 'practical' && (
        <Practical
          progress={progress}
          onChange={setProgress}
          onBack={goHome}
        />
      )}

      {screen === 'review-empty' && (
        <Placeholder
          icon="✨"
          title="오답노트가 비어 있어요"
          body="틀린 문항이 쌓이면 여기서 복습할 수 있어요."
          onBack={goHome}
        />
      )}
    </div>
  )
}
