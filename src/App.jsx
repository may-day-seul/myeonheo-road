import { useState } from 'react'
import Header from './components/Header.jsx'
import Home from './screens/Home.jsx'
import Placeholder from './screens/Placeholder.jsx'
import { load, effectiveStreak } from './lib/storage.js'

const PLACEHOLDERS = {
  quiz: { icon: '🚦', title: '오늘의 퀴즈' },
  review: { icon: '📝', title: '오답노트 복습' },
  practical: { icon: '🚙', title: '실기 체크리스트' },
  mock: { icon: '⏱️', title: '실전 모의고사' },
}

export default function App() {
  const [progress, setProgress] = useState(load)
  const [screen, setScreen] = useState('home')
  const [filter, setFilter] = useState('all')

  const goHome = () => {
    setProgress(load())
    setScreen('home')
  }

  return (
    <div className="container">
      <Header streak={effectiveStreak(progress)} />
      {screen === 'home' ? (
        <Home
          progress={progress}
          filter={filter}
          onFilterChange={setFilter}
          onNavigate={setScreen}
        />
      ) : (
        <Placeholder {...PLACEHOLDERS[screen]} onBack={goHome} />
      )}
    </div>
  )
}
