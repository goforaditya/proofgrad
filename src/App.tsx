import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { usePageView } from '@/lib/usePageView'

// Landing
import LandingPage from '@/pages/LandingPage'

// Auth pages
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import InstructorLogin from '@/pages/auth/InstructorLogin'
import CompleteProfile from '@/pages/auth/CompleteProfile'

// Layout
import ProtectedRoute from '@/components/layout/ProtectedRoute'

// Instructor pages
import InstructorDashboard from '@/pages/instructor/Dashboard'
import SessionControl from '@/pages/instructor/SessionControl'
import SurveyBuilder from '@/pages/instructor/SurveyBuilder'
import LectureNotesEditor from '@/pages/instructor/LectureNotesEditor'
import ArticleEditor from '@/pages/instructor/ArticleEditor'
import ResourceManager from '@/pages/instructor/ResourceManager'

// Student pages
import JoinSession from '@/pages/student/JoinSession'
import SessionView from '@/pages/student/SessionView'
import SurveyForm from '@/pages/student/SurveyForm'
import DatasetView from '@/pages/student/DatasetView'
import AnalysisWorkspace from '@/pages/student/AnalysisWorkspace'
import PortfolioExport from '@/pages/student/PortfolioExport'
import CpiBuilder from '@/pages/student/CpiBuilder'

// Blog
import ArticleFeed from '@/pages/blog/ArticleFeed'
import ArticleView from '@/pages/blog/ArticleView'

// Resources
import ResourcesPage from '@/pages/resources/ResourcesPage'

function PageViewTracker() {
  usePageView()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <PageViewTracker />
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes (public) */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/instructor" element={<InstructorLogin />} />
        <Route
          path="/auth/complete-profile"
          element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />

        {/* Instructor routes (protected, instructor only) */}
        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute role="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/session/:sessionId"
          element={
            <ProtectedRoute role="instructor">
              <SessionControl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/session/:sessionId/survey"
          element={
            <ProtectedRoute role="instructor">
              <SurveyBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/session/:sessionId/notes"
          element={
            <ProtectedRoute role="instructor">
              <LectureNotesEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/session/:sessionId/dataset"
          element={
            <ProtectedRoute role="instructor">
              <DatasetView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/session/:sessionId/analysis"
          element={
            <ProtectedRoute role="instructor">
              <AnalysisWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/articles"
          element={
            <ProtectedRoute role="instructor">
              <ArticleEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/resources"
          element={
            <ProtectedRoute role="instructor">
              <ResourceManager />
            </ProtectedRoute>
          }
        />

        {/* User/session routes (public — guests allowed) */}
        <Route path="/join" element={<JoinSession />} />
        {/* Legacy redirect */}
        <Route path="/student/join" element={<JoinSession />} />
        <Route path="/student/session/:sessionId" element={<SessionView />} />
        <Route path="/student/session/:sessionId/survey" element={<SurveyForm />} />
        <Route path="/student/session/:sessionId/dataset" element={<DatasetView />} />
        <Route path="/student/session/:sessionId/analysis" element={<AnalysisWorkspace />} />
        <Route path="/student/session/:sessionId/export" element={<PortfolioExport />} />
        <Route path="/student/session/:sessionId/cpi" element={<CpiBuilder />} />

        {/* Resources (public) */}
        <Route path="/resources" element={<ResourcesPage />} />

        {/* Blog (public) */}
        <Route path="/blog" element={<ArticleFeed />} />
        <Route path="/blog/:slug" element={<ArticleView />} />

        {/* Unauthorized */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

function Unauthorized() {
  return (
    <div className="liquid-bg min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="liquid-orb-3" />
      <div className="glass-strong p-8 text-center relative z-[1] fade-in-up max-w-sm">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F0F7' }}>Access Denied</h1>
        <p className="text-sm mb-4" style={{ color: '#9090B0' }}>
          You don't have permission to view this page.
        </p>
        <a href="/" className="text-sm font-medium" style={{ color: '#635BFF' }}>← Go home</a>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="liquid-bg min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="liquid-orb-3" />
      <div className="glass-strong p-8 text-center relative z-[1] fade-in-up max-w-sm">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F0F7' }}>404 — Page Not Found</h1>
        <a href="/" className="text-sm font-medium" style={{ color: '#635BFF' }}>← Go home</a>
      </div>
    </div>
  )
}
