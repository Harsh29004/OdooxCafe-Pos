import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { StoreProvider } from './store.jsx'

// ---------------------------------------------------------------------------
// The only global CSS in the app. There is no .css file — this small string
// covers three things inline styles can't do on their own:
//   1. a page reset (margins, box-sizing, base font/background)
//   2. the print rules for the receipt ("Save as PDF" → a tidy 80mm slip with
//      no browser URL header/footer)
// Everything else is inline style={{...}} on the components themselves.
// ---------------------------------------------------------------------------
const globalCss = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; margin: 0; }
  body {
    background: #f1f5f9;
    color: #1e293b;
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  /* Brand-tinted text selection. */
  ::selection { background: #d9bfd4; color: #2a1b27; }

  /* Keyboard focus ring — only shows for keyboard users, not mouse clicks.
     Gives every interactive element a consistent, accessible outline. */
  :focus-visible {
    outline: 2px solid #a06d93;
    outline-offset: 2px;
    border-radius: 6px;
  }

  /* Slim, unobtrusive scrollbars (WebKit) that match the slate palette. */
  * { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1; border-radius: 999px;
    border: 3px solid transparent; background-clip: content-box;
  }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; background-clip: content-box; }

  /* Entrance animations used by modals, popups and drawers. */
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn {
    from { opacity: 0; transform: translateY(8px) scale(.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(24px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* Respect users who prefer less motion. */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .001ms !important;
      transition-duration: .001ms !important;
    }
  }

  /* Printing a receipt: show only the #receipt block, sized like a till slip. */
  @media print {
    @page { size: 80mm auto; margin: 0; }
    body * { visibility: hidden; }
    #receipt, #receipt * { visibility: visible; }
    #receipt {
      position: absolute !important;
      left: 0; top: 0;
      width: 80mm !important;
      padding: 6mm 5mm !important;
    }
  }
`
const styleEl = document.createElement('style')
styleEl.textContent = globalCss
document.head.appendChild(styleEl)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
