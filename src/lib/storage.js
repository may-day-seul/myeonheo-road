const KEY = 'dl2-progress-v4'
const KEY_V3 = 'dl2-progress-v3'

const DEFAULT = {
  streak: 0,
  lastDate: null,
  total: 0,
  correct: 0,
  wrongIds: [],
  solvedIds: [],
  practicalDone: [],
  // 문항별 시도/오답 횟수. 영역별 오답률의 근거가 된다.
  // wrongIds는 '지금 틀린 상태'만 담고 다시 맞히면 빠지므로 누적 집계가 따로 필요하다.
  attempts: {}, // { [문항번호]: { n: 시도, w: 오답 } }
}

// v3에는 횟수 기록이 없다. 아는 만큼만 옮긴다 — 푼 문항은 1회 시도로,
// 그중 현재 오답인 문항은 1회 오답으로 본다.
function migrateV3(old) {
  const attempts = {}
  for (const id of old.solvedIds ?? []) attempts[id] = { n: 1, w: 0 }
  for (const id of old.wrongIds ?? []) attempts[id] = { n: 1, w: 1 }
  return { ...DEFAULT, ...old, attempts }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) }
    // v3 키는 지우지 않는다(되돌릴 여지를 남긴다).
    const legacy = localStorage.getItem(KEY_V3)
    if (legacy) return migrateV3(JSON.parse(legacy))
    return { ...DEFAULT }
  } catch {
    return { ...DEFAULT }
  }
}

export function save(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

// 채점 결과를 문항별 누적 횟수에 더한다.
export function addAttempts(attempts, entries) {
  const next = { ...attempts }
  for (const r of entries) {
    const cur = next[r.id] ?? { n: 0, w: 0 }
    next[r.id] = { n: cur.n + 1, w: cur.w + (r.correct ? 0 : 1) }
  }
  return next
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
