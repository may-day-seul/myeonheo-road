import { useState } from 'react'
import Header from './components/Header.jsx'
import Home from './screens/Home.jsx'
import Quiz from './screens/Quiz.jsx'
import Result from './screens/Result.jsx'
import Mock from './screens/Mock.jsx'
import MockResult from './screens/MockResult.jsx'
import Practical from './screens/Practical.jsx'
import Areas from './screens/Areas.jsx'
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

export default function App() {
  const [progress, setProgress] = useState(load)
  const [screen, setScreen] = useState('home')
  const [filter, setFilter] = useState('all')
  const [questions, setQuestions] = useState([])
  const [quizTitle, setQuizTitle] = useState('오늘의 코스')
  const [results, setResults] = useState([])
  const [mock, setMock] = useState(null)

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
    setQuizTitle('오늘의 코스')
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
    setScreen('result')
  }

  const submitMock = (answers, timedOut) => {
    record(
      questions.map((q) => ({
        id: q.i,
        correct: isCorrect(q, answers.get(q.i) ?? []),
      })),
    )
    setMock({ answers, timedOut, summary: scoreMock(questions, answers) })
    setScreen('mock-result')
  }

  return (
    <div className="container">
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
        <Result results={results} onRetry={startDaily} onHome={goHome} />
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
          onRetry={startMock}
          onHome={goHome}
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
