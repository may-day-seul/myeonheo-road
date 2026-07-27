import bank from '../data/bank.json'

export const QUIZ_SIZE = 10
export const PASS_SCORE = 60

// 실전 모의고사: 40문항 40분
export const MOCK_SIZE = 40
export const MOCK_MINUTES = 40

// 추정 배점 — 공단의 공식 배점표는 공개돼 있지 않다. 문장형보다 사진·일러스트형
// 배점이 높다는 통설을 따라 근사한 값이며, 실제 시험 배점과 다를 수 있다.
// 화면에도 '추정 배점'임을 표기한다.
export const SCORE_WEIGHTS = { text: 2, img: 3 }

export const weightOf = (q) => SCORE_WEIGHTS[q.t] ?? 2

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

// 모의고사는 실제 시험처럼 전 범위에서 무작위로 뽑는다(유형 필터·학습 이력 무시).
export function pickMock(size = MOCK_SIZE) {
  return shuffle(bank).slice(0, size)
}

// 가중 배점을 100점 만점으로 환산한다. 배점 구성이 회차마다 달라지므로
// 획득 점수를 만점 대비 비율로 계산한다.
export function scoreMock(questions, answers) {
  let earned = 0
  let total = 0
  for (const q of questions) {
    const w = weightOf(q)
    total += w
    if (isCorrect(q, answers.get(q.i) ?? [])) earned += w
  }
  return {
    earned,
    total,
    score: total > 0 ? Math.round((earned / total) * 100) : 0,
  }
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
