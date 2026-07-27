import bank from '../data/bank.json'

export const QUIZ_SIZE = 10

const byId = new Map(bank.map((q) => [q.i, q]))

export const getQuestion = (id) => byId.get(id)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function applyFilter(pool, filter) {
  if (filter === 'text') return pool.filter((q) => q.t === 'text')
  if (filter === 'img') return pool.filter((q) => q.t === 'img')
  return pool
}

// 아직 풀지 않은 문항을 먼저 소진해 1,000문항을 한 바퀴 돌게 한다.
// 남은 미출제 문항이 모자라면 기출제 문항으로 채운다.
export function pickDaily(progress, filter, size = QUIZ_SIZE) {
  const pool = applyFilter(bank, filter)
  const solved = new Set(progress.solvedIds)
  const picked = shuffle(pool.filter((q) => !solved.has(q.i))).slice(0, size)
  if (picked.length < size) {
    const seen = new Set(picked.map((q) => q.i))
    const filler = shuffle(pool.filter((q) => !seen.has(q.i)))
    picked.push(...filler.slice(0, size - picked.length))
  }
  return shuffle(picked)
}

export function pickReview(progress, size = QUIZ_SIZE) {
  return shuffle(progress.wrongIds)
    .slice(0, size)
    .map(getQuestion)
    .filter(Boolean)
}

// a와 selected 모두 1-based 보기 번호. 복수정답은 순서와 무관하게 비교한다.
export function isCorrect(q, selected) {
  if (selected.length !== q.a.length) return false
  const s = [...selected].sort((x, y) => x - y)
  const a = [...q.a].sort((x, y) => x - y)
  return s.every((v, i) => v === a[i])
}

// 정답 번호는 어떤 경우에도 고를 수 있어야 하므로 nc가 어긋나도 보기를 늘린다.
export function optionCount(q) {
  const declared = q.t === 'img' ? (q.nc ?? 4) : q.c.length
  return Math.max(declared, ...q.a)
}
