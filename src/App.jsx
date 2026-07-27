import { useState } from 'react'
import Header from './components/Header.jsx'
import Home from './screens/Home.jsx'
import Quiz from './screens/Quiz.jsx'
import Result from './screens/Result.jsx'
import Placeholder from './screens/Placeholder.jsx'
import { load, save, bumpStreak, effectiveStreak } from './lib/storage.js'
import { pickDaily, pickReview } from './lib/quiz.js'

const PLACEHOLDERS = {
  practical: { icon: '🚙', title: '실기 체크리스트' },
  mock: { icon: '⏱️', title: '실전 모의고사' },
}

export default function App() {
  const [progress, setProgress] = useState(load)
  const [screen, setScreen] = useState('home')
  const [filter, setFilter] = useState('all')
  const [questions, setQuestions] = useState([])
  const [quizTitle, setQuizTitle] = useState('오늘의 코스')
  const [results, setResults] = useState([])

  const goHome = () => setScreen('home')

  const startDaily = () => {
    setQuestions(pickDaily(progress, filter))
    setQuizTitle('오늘의 코스')
    setScreen('quiz')
  }

  const startReview = () => {
    const qs = pickReview(progress)
    if (qs.length === 0) {
      setScreen('review-empty')
      return
    }
    setQuestions(qs)
    setQuizTitle('오답노트 복습')
    setScreen('quiz')
  }

  const navigate = (target) => {
    if (target === 'quiz') return startDaily()
    if (target === 'review') return startReview()
    setScreen(target)
  }

  const finishQuiz = (quizResults) => {
    const p = load()
    const solved = new Set(p.solvedIds)
    const wrong = new Set(p.wrongIds)
    for (const r of quizResults) {
      solved.add(r.id)
      // 다시 맞히면 오답노트에서 자동으로 빠진다.
      if (r.correct) wrong.delete(r.id)
      else wrong.add(r.id)
    }
    const updated = bumpStreak({
      ...p,
      total: p.total + quizResults.length,
      correct: p.correct + quizResults.filter((r) => r.correct).length,
      solvedIds: [...solved],
      wrongIds: [...wrong],
    })
    save(updated)
    setProgress(updated)
    setResults(quizResults)
    setScreen('result')
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

      {screen === 'review-empty' && (
        <Placeholder
          icon="✨"
          title="오답노트가 비어 있어요"
          body="틀린 문항이 쌓이면 여기서 복습할 수 있어요."
          onBack={goHome}
        />
      )}

      {PLACEHOLDERS[screen] && (
        <Placeholder {...PLACEHOLDERS[screen]} onBack={goHome} />
      )}
    </div>
  )
}
