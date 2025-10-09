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
import { Toaster } from '@/components/ui/sonner'

const App = () => {
  // Application state
  const [currentPage, setCurrentPage] = useState('home') // home, login, signup, dashboard
  const [activeTab, setActiveTab] = useState('upload')
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('recursiaDxUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
        setCurrentPage('dashboard')
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('recursiaDxUser')
      }
    }
  }, [])

  // Authentication handlers
  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    setCurrentPage('dashboard')
    
    // Save to localStorage if remember me is checked
    if (userData.rememberMe) {
      localStorage.setItem('recursiaDxUser', JSON.stringify(userData))
    }
  }

  const handleSignup = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    setCurrentPage('dashboard')
    
    // Save new user to localStorage
    localStorage.setItem('recursiaDxUser', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setCurrentPage('home')
    setActiveTab('upload')
    localStorage.removeItem('recursiaDxUser')
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
        return <SampleUpload onNext={() => setActiveTab('viewer')} />
      case 'viewer':
        return <WSIViewer onNext={() => setActiveTab('analysis')} />
      case 'analysis':
      case 'analysis-blood':
      case 'analysis-tissue':
        return <AnalysisDashboard 
          onNext={() => setActiveTab('review')} 
          analysisType={activeTab.includes('blood') ? 'blood' : activeTab.includes('tissue') ? 'tissue' : 'general'}
        />
      case 'review':
        return <ResultsReview onNext={() => setActiveTab('report')} />
      case 'report':
      case 'report-patient':
      case 'report-lab':
        return <ReportGeneration 
          reportType={activeTab.includes('patient') ? 'patient' : activeTab.includes('lab') ? 'lab' : 'general'}
        />
      default:
        return <SampleUpload onNext={() => setActiveTab('viewer')} />
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

export default App
