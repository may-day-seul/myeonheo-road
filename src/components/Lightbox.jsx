import { useEffect, useState } from 'react'

// 문항 카드는 900px 원본을 화면 폭(약 314px)으로 줄여 보여주기 때문에
// 작은 글씨가 뭉갠다. 라이트박스는 기본을 원본 크기로 열고, 좌우로 밀어
// 읽게 한다. 전체를 한눈에 보고 싶으면 '맞춤'으로 전환한다.
export default function Lightbox({ src, alt, onClose }) {
  const [fit, setFit] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal="true">
      <div className="lightbox-bar">
        <button
          className="lightbox-btn"
          onClick={() => setFit((f) => !f)}
          aria-pressed={fit}
        >
          {fit ? '⤢ 원본 크기' : '⤡ 전체 보기'}
        </button>
        <button
          className="lightbox-btn round"
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="lightbox-scroll" onClick={onClose}>
        <img
          className={fit ? 'fit' : 'natural'}
          src={src}
          alt={alt}
          onClick={(e) => {
            e.stopPropagation()
            setFit((f) => !f)
          }}
        />
      </div>

      <p className="lightbox-hint">
        {fit
          ? '이미지를 탭하면 원본 크기 · 바깥을 탭하면 닫기'
          : '좌우로 밀어서 읽기 · 이미지를 탭하면 전체 보기'}
      </p>
    </div>
  )
}
