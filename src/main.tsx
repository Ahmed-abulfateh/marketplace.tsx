import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'
import { MarketplaceProvider } from './context/MarketplaceContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <MarketplaceProvider>
        <BrowserRouter basename="/marketplace.tsx">
          <App />
        </BrowserRouter>
      </MarketplaceProvider>
    </LanguageProvider>
  </StrictMode>,
)
