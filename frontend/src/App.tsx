import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Welcome from './pages/auth/Welcome'
import AuthPage from './pages/auth/AuthPage'
import AddStudent from './pages/counselor/AddStudent'
import CounselorDashboard from './pages/counselor/CounselorDashboard'
import StudentDetail from './pages/counselor/StudentDetail'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'counselor') return <Navigate to="/" replace />

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<AuthPage />} />

      <Route
        path="/counselor"
        element={
          <ProtectedRoute>
            <CounselorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counselor/students/new"
        element={
          <ProtectedRoute>
            <AddStudent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counselor/students/:studentId"
        element={
          <ProtectedRoute>
            <StudentDetail />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
