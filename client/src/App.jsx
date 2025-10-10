import React, { useState, useEffect } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { HomePage } from './components/HomePage'
import { LoginPage } from './components/LoginPage'
import { SignupPage } from './components/SignupPage'
import { DashboardSidebar } from './components/DashboardSidebar'
import { NavigationHeader } from './components/NavigationHeader'
import { SampleUpload } from './components/SampleUpload'
import { WSIViewer } from './components/WSIViewer'
import { AnalysisDashboard } from './components/AnalysisDashboard'
import { ResultsReview } from './components/ResultsReview'
import { ReportGeneration } from './components/ReportGeneration'
import { MLDemo } from './components/MLDemo'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'

const AppContent = () => {
  const { isAuthenticated, user, logout, loading } = useAuth()
  // Application state
  const [currentPage, setCurrentPage] = useState('home') // home, login, signup, dashboard
  const [activeTab, setActiveTab] = useState('upload')
  const [currentSample, setCurrentSample] = useState(null) // Store current sample data

  // Update page based on authentication status
  useEffect(() => {
    if (isAuthenticated && currentPage === 'home') {
      setCurrentPage('dashboard')
    } else if (!isAuthenticated && currentPage === 'dashboard') {
      setCurrentPage('home')
    }
  }, [isAuthenticated, currentPage])

  // Authentication handlers
  const handleLogin = (userData) => {
    setCurrentPage('dashboard')
  }

  const handleSignup = (userData) => {
    setCurrentPage('dashboard')
  }

  const handleLogout = async () => {
    await logout()
    setCurrentPage('home')
    setActiveTab('upload')
    setCurrentSample(null) // Clear sample data on logout
  }

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Navigation handlers
  const goToHome = () => setCurrentPage('home')
  const goToLogin = () => setCurrentPage('login')
  const goToSignup = () => setCurrentPage('signup')
  const goToDashboard = () => {
    if (isAuthenticated) {
      setCurrentPage('dashboard')
    } else {
      setCurrentPage('login')
    }
  }

  // Dashboard content renderer
  const renderDashboardContent = () => {
    switch (activeTab) {
      case 'upload':
        return <SampleUpload 
          onNext={() => setActiveTab('viewer')} 
          onSampleCreated={(sample) => {
            console.log('🔍 App: Received sample from upload:', sample)
            setCurrentSample(sample)
          }}
        />
      case 'viewer':
        console.log('🔍 App: Passing sample to WSI viewer:', currentSample)
        return <WSIViewer 
          onNext={() => setActiveTab('analysis')} 
          sample={currentSample}
        />
      case 'analysis':
      case 'analysis-blood':
      case 'analysis-tissue':
        return <AnalysisDashboard 
          onNext={() => setActiveTab('review')} 
          analysisType={activeTab.includes('blood') ? 'blood' : activeTab.includes('tissue') ? 'tissue' : 'general'}
          sample={currentSample}
        />
      case 'ml-demo':
        return <MLDemo />
      case 'review':
        return <ResultsReview 
          onNext={() => setActiveTab('report')} 
          sample={currentSample}
        />
      case 'report':
      case 'report-patient':
      case 'report-lab':
        return <ReportGeneration 
          reportType={activeTab.includes('patient') ? 'patient' : activeTab.includes('lab') ? 'lab' : 'general'}
          sample={currentSample}
        />
      default:
        return <SampleUpload 
          onNext={() => setActiveTab('viewer')} 
          onSampleCreated={(sample) => setCurrentSample(sample)}
        />
    }
  }

  // Main page renderer
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            onLogin={goToLogin}
            onSignup={goToSignup}
          />
        )
      
      case 'login':
        return (
          <LoginPage 
            onLogin={handleLogin}
            onBackToHome={goToHome}
            onGoToSignup={goToSignup}
          />
        )
      
      case 'signup':
        return (
          <SignupPage 
            onSignup={handleSignup}
            onBackToHome={goToHome}
            onGoToLogin={goToLogin}
          />
        )
      
      case 'dashboard':
        if (!isAuthenticated) {
          return (
            <LoginPage 
              onLogin={handleLogin}
              onBackToHome={goToHome}
              onGoToSignup={goToSignup}
            />
          )
        }
        
        return (
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <DashboardSidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                user={user}
                onLogout={handleLogout}
              />
              <SidebarInset className="flex-1">
                <NavigationHeader 
                  user={user}
                  onLogout={handleLogout}
                  onGoToHome={goToHome}
                />
                <main className="flex-1 p-6 pl-20">
                  {renderDashboardContent()}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )
      
      default:
        return (
          <HomePage 
            onLogin={goToLogin}
            onSignup={goToSignup}
          />
        )
    }
  }

  return (
    <>
      {renderCurrentPage()}
      <Toaster />
    </>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
