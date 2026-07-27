import categories from '../data/categories.json'

// 영역은 bank.json에 없어 문항 텍스트로 분류한 값이다(tools/build-categories.py).
// 근사치이므로 화면에도 '추정 분류'임을 밝힌다.
export const AREAS = [
  { code: 'sign', name: '표지·신호', icon: '🚸' },
  { code: 'walk', name: '보행자·보호구역', icon: '🚶' },
  { code: 'drive', name: '통행방법·교차로', icon: '🔀' },
  { code: 'speed', name: '속도·안전운전', icon: '⚡' },
  { code: 'license', name: '면허·음주·처벌', icon: '📋' },
  { code: 'accident', name: '사고·응급조치', icon: '🚑' },
  { code: 'car', name: '자동차·장치', icon: '🔧' },
  { code: 'etc', name: '기타', icon: '📌' },
]

// 표본이 이만큼 쌓여야 오답률을 신뢰할 수 있다고 본다.
export const MIN_ATTEMPTS = 5

export const areaOf = (id) => categories[id] ?? 'etc'

export const areaName = (code) =>
  AREAS.find((a) => a.code === code)?.name ?? code

// categories.json이 1,000문항 전부의 영역을 담고 있어 bank.json 없이 만들 수 있다.
const idsByArea = new Map(AREAS.map((a) => [a.code, []]))
for (const id of Object.keys(categories))
  idsByArea.get(categories[id])?.push(Number(id))

export const areaQuestionIds = (code) => idsByArea.get(code) ?? []

// 영역별 시도/오답 집계. rate는 오답률(0~1), ready는 표본이 충분한지.
export function areaStats(progress) {
  const attempts = progress.attempts ?? {}
  return AREAS.map((a) => {
    const ids = idsByArea.get(a.code) ?? []
    let n = 0
    let w = 0
    let solved = 0
    for (const id of ids) {
      const rec = attempts[id]
      if (!rec) continue
      n += rec.n
      w += rec.w
      solved += 1
    }
    return {
      ...a,
      total: ids.length,
      solved,
      n,
      w,
      rate: n > 0 ? w / n : 0,
      ready: n >= MIN_ATTEMPTS,
    }
  }).filter((a) => a.total > 0)
}

// 표본이 충분한 영역만 오답률 높은 순으로. 오답이 하나도 없으면 취약하다고 보지 않는다.
export function weakAreas(progress, k = 3) {
  return areaStats(progress)
    .filter((a) => a.ready && a.w > 0)
    .sort((x, y) => y.rate - x.rate || y.w - x.w)
    .slice(0, k)
}
