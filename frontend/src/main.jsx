import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { VisitorProvider } from './context/VisitorContext.jsx'
import { AuthProvider }    from './context/AuthContext.jsx'
import { ToastProvider }   from './context/ToastContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VisitorProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </VisitorProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

