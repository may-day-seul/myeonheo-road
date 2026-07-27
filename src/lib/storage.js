const KEY = 'dl2-progress-v3'

const DEFAULT = {
  streak: 0,
  lastDate: null,
  total: 0,
  correct: 0,
  wrongIds: [],
  solvedIds: [],
  practicalDone: [],
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT }
  }
}

export function save(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 스트릭 규칙: lastDate가 어제면 +1, 그 이전이면 1로 리셋, 오늘이면 유지.
// 퀴즈를 완료한 시점에 호출한다.
export function bumpStreak(progress) {
  const today = todayStr()
  if (progress.lastDate === today) return progress
  const yesterday = todayStr(new Date(Date.now() - 24 * 60 * 60 * 1000))
  const streak = progress.lastDate === yesterday ? progress.streak + 1 : 1
  return { ...progress, streak, lastDate: today }
}

// 오늘 학습하지 않았고 lastDate가 어제보다 이전이면 표시용 스트릭은 0으로 본다.
export function effectiveStreak(progress) {
  const today = todayStr()
  const yesterday = todayStr(new Date(Date.now() - 24 * 60 * 60 * 1000))
  if (progress.lastDate === today || progress.lastDate === yesterday)
    return progress.streak
  return 0
}
