// bank.json은 686KB라 JS 번들에 인라인되면 첫 화면이 그만큼 늦어진다.
// ?url로 별도 에셋으로 내보내 앱 셸이 먼저 뜨게 하고, 데이터는 따로 받아온다.
// 파일 자체는 src/data에 그대로 둔다 — verify/verify.mjs가 그 경로를 읽는다.
// 에셋이 분리되면 앱 코드를 고쳐도 문제은행 캐시는 그대로 살아 있다.
import bankUrl from '../data/bank.json?url'

export const TOTAL_QUESTIONS = 1000

let bank = []
let byId = new Map()

export async function loadBank() {
  if (bank.length) return bank
  const res = await fetch(bankUrl)
  if (!res.ok) throw new Error(`문제은행을 불러오지 못했습니다 (${res.status})`)
  const data = await res.json()
  bank = data
  byId = new Map(data.map((q) => [q.i, q]))
  return bank
}

export const allQuestions = () => bank
export const getQuestion = (id) => byId.get(id)
