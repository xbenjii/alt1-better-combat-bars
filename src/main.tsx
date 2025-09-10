import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Alt1Wrapper from './Alt1Wrapper.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Alt1Wrapper>
      <App />
    </Alt1Wrapper>
  </StrictMode>,
)
