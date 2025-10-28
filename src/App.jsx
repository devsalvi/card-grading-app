import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Hub } from 'aws-amplify/utils'
import { App as CapacitorApp } from '@capacitor/app'
import './App.css'
import LandingPage from './pages/LandingPage'
import MainPage from './pages/MainPage'
import AdminPortal from './pages/AdminPortal'

function App() {
  useEffect(() => {
    // Handle OAuth callback on native platforms (iOS/Android)
    const handleAppUrlOpen = async (event) => {
      // When app opens via custom URL scheme (OAuth callback)
      if (event.url) {
        console.log('App opened with URL:', event.url)
        // Amplify will automatically handle the OAuth code exchange
      }
    }

    // Listen for app URL open events (OAuth redirects on native platforms)
    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen)

    // Listen for Amplify Auth Hub events
    const hubListener = Hub.listen('auth', (data) => {
      const { payload } = data
      console.log('Auth Hub event:', payload.event, payload)

      switch (payload.event) {
        case 'signInWithRedirect':
          console.log('OAuth sign in redirect initiated')
          break
        case 'signInWithRedirect_failure':
          console.error('OAuth sign in failed:', payload.data)
          break
        case 'customOAuthState':
          console.log('OAuth state:', payload.data)
          break
        default:
          break
      }
    })

    // Cleanup listeners on unmount
    return () => {
      CapacitorApp.removeAllListeners()
      hubListener()
    }
  }, [])

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submit" element={<MainPage />} />
          <Route path="/admin" element={<AdminPortal />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
