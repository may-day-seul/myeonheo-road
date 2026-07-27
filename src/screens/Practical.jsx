import { load, save } from '../lib/storage.js'

// CLAUDE.md에 명시된 항목 그대로. id는 localStorage에 저장되므로 바꾸지 말 것.
export const SECTIONS = [
  {
    id: 'course',
    title: '장내기능',
    icon: '🅿️',
    items: [
      {
        id: 'c1',
        label: '출발 전 기본조작',
        hint: '안전벨트·기어·사이드·방향지시등',
      },
      { id: 'c2', label: '경사로 정지·출발', hint: '밀림 없이' },
      { id: 'c3', label: '직각주차(T자)', hint: '사이드미러 기준점' },
      { id: 'c4', label: '신호교차로·좌우회전', hint: '깜빡이 타이밍' },
      { id: 'c5', label: '돌발 상황 대응', hint: '3초 내 급정지 + 비상등' },
    ],
  },
  {
    id: 'road',
    title: '도로주행',
    icon: '🛣️',
    items: [
      { id: 'r1', label: '차로변경 루틴', hint: '깜빡이 → 거울 → 어깨너머' },
      { id: 'r2', label: '교차로 황색신호 대응', hint: '' },
      { id: 'r3', label: '시험 코스 사전 답사', hint: '' },
      { id: 'r4', label: '제한속도 유지', hint: '제한속도 -5km' },
      { id: 'r5', label: '종료 시 마무리', hint: '기어 P → 사이드 → 시동' },
    ],
  },
]

const ALL = SECTIONS.flatMap((s) => s.items.map((i) => i.id))

export default function Practical({ progress, onChange, onBack }) {
  const done = new Set(progress.practicalDone)

  const toggle = (id) => {
    const next = new Set(done)
    next.has(id) ? next.delete(id) : next.add(id)
    const p = { ...load(), practicalDone: [...next] }
    save(p)
    onChange(p)
  }

  const doneCount = ALL.filter((id) => done.has(id)).length

  return (
    <div className="practical">
      <div className="quiz-bar">
        <button className="icon-btn" onClick={onBack} aria-label="뒤로">
          ←
        </button>
        <div className="quiz-track">
          <div
            className="quiz-track-fill"
            style={{ width: `${(doneCount / ALL.length) * 100}%` }}
          />
        </div>
        <span className="quiz-count">
          <strong>{doneCount}</strong>/{ALL.length}
        </span>
      </div>

      <div className="practical-head">
        <h1 className="hero-title">실기 체크리스트</h1>
        <p className="hero-sub">
          시험 전에 하나씩 짚어보세요. 체크는 자동 저장됩니다.
        </p>
      </div>

      {SECTIONS.map((s) => {
        const n = s.items.filter((i) => done.has(i.id)).length
        return (
          <section className="card check-card" key={s.id}>
            <div className="section-title">
              <span>
                {s.icon} {s.title}
              </span>
              <span className="sub">
                {n}/{s.items.length}
              </span>
            </div>
            <ul className="check-list">
              {s.items.map((item) => {
                const on = done.has(item.id)
                return (
                  <li key={item.id}>
                    <button
                      className={`check ${on ? 'on' : ''}`}
                      onClick={() => toggle(item.id)}
                      aria-pressed={on}
                    >
                      <span className="box">{on ? '✓' : ''}</span>
                      <span className="check-text">
                        <strong>{item.label}</strong>
                        {item.hint && <em>{item.hint}</em>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {doneCount === ALL.length && (
        <div className="verdict ok">
          <span className="verdict-ico">🎉</span>
          <div>
            <strong>전부 점검했어요</strong>
            <p>준비 끝. 시험장에서 침착하게!</p>
          </div>
        </div>
      )}

      <button className="btn-secondary center" onClick={onBack}>
        홈으로
      </button>
    </div>
  )
}
