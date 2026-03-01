import { lazy, Suspense, Component } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { TickerTape } from './components/ui/TickerTape'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Login } from './pages/Login'

const Landing = lazy(() => import('./pages/Landing').then(module => ({ default: module.Landing })))
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })))
const Markets = lazy(() => import('./pages/Markets').then(module => ({ default: module.Markets })))
const AIAdvisor = lazy(() => import('./pages/AIAdvisor').then(module => ({ default: module.AIAdvisor })))
const Portfolio = lazy(() => import('./pages/Portfolio').then(module => ({ default: module.Portfolio })))
const Screener = lazy(() => import('./pages/Screener').then(module => ({ default: module.Screener })))
const Alerts = lazy(() => import('./pages/Alerts').then(module => ({ default: module.Alerts })))
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })))

// Catches any JS crashes and shows the error instead of a black screen
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#0a0a0a', color: '#ff4444', fontFamily: 'monospace', padding: '40px', minHeight: '100vh' }}>
          <h1 style={{ color: '#00ffcc' }}>⚠ Nexus Trade — Startup Error</h1>
          <p>The app crashed during startup. Error details:</p>
          <pre style={{ background: '#111', padding: '20px', borderRadius: '8px', overflow: 'auto', color: '#ff8888' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <TickerTape />
          <Suspense fallback={<div className="h-screen w-screen bg-background flex items-center justify-center text-primary font-mono text-xl animate-pulse">BOOTING NEXUS TERMINAL...</div>}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/ai" element={<AIAdvisor />} />
              <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
              <Route path="/screener" element={<Screener />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
