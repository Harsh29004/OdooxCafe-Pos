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
