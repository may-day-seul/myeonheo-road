import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const DISMISS_KEY = 'dl2-install-dismissed'

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS는 데스크톱 Safari로 위장한다
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export default function PwaPrompts() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const [deferred, setDeferred] = useState(null)
  const [iosHint, setIosHint] = useState(false)
  const [hidden, setHidden] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  )

  useEffect(() => {
    if (isStandalone()) return
    // 크롬 계열은 설치 가능해지면 이 이벤트를 준다. 기본 배너는 막고 직접 띄운다.
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    // 설치가 끝나면 배너를 내린다(다른 경로로 설치했을 때도 포함).
    const onInstalled = () => setDeferred(null)
    window.addEventListener('appinstalled', onInstalled)
    // iOS Safari는 이 이벤트가 없고 공유 메뉴로만 추가된다.
    if (isIos()) setIosHint(true)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setHidden(true)
  }

  const install = async () => {
    if (!deferred) return
    try {
      deferred.prompt()
      const { outcome } = await deferred.userChoice
      // 설치를 수락했을 때만 배너를 내린다. 안드로이드에서는 뒤로가기나 스와이프로
      // 시스템 대화상자가 쉽게 닫히는데, 그때 배너까지 없애면 beforeinstallprompt가
      // 다시 오지 않아 새로고침 전까지 설치할 방법이 사라진다.
      if (outcome === 'accepted') setDeferred(null)
    } catch {
      // prompt()는 이벤트당 한 번만 쓸 수 있다. 이미 소비된 이벤트면 버린다.
      setDeferred(null)
    }
  }

  // 업데이트 안내가 설치 안내보다 우선한다.
  if (needRefresh) {
    return (
      <div className="pwa-bar">
        <span className="pwa-text">새 버전이 준비됐어요</span>
        <button
          className="pwa-action"
          onClick={() => updateServiceWorker(true)}
        >
          새로고침
        </button>
      </div>
    )
  }

  if (hidden) return null

  if (deferred) {
    return (
      <div className="pwa-bar">
        <span className="pwa-text">
          홈 화면에 추가하면 앱처럼 쓰고 오프라인에서도 열려요
        </span>
        <button className="pwa-action" onClick={install}>
          추가
        </button>
        <button className="pwa-close" onClick={dismiss} aria-label="닫기">
          ✕
        </button>
      </div>
    )
  }

  if (iosHint) {
    return (
      <div className="pwa-bar">
        <span className="pwa-text">
          홈 화면에 추가하려면 하단 공유 <b>⎋</b> → <b>홈 화면에 추가</b>
        </span>
        <button className="pwa-close" onClick={dismiss} aria-label="닫기">
          ✕
        </button>
      </div>
    )
  }

  return null
}
