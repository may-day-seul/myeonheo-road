import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 한글 동적 서브셋: 브라우저가 실제 사용된 글자 조각만 내려받는다.
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
