import React, { useState, useEffect, Suspense } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Context providers
import { SanctuaryProvider } from './contexts/SanctuaryContext';
import { StoryProvider } from './contexts/StoryContext';
import { SkillsProvider } from './contexts/SkillsContext';

// Components
import LoadingScreen from './components/Common/LoadingScreen';
import ErrorBoundary from './components/Common/ErrorBoundary';
import SanctuaryContainer from './components/Sanctuary/SanctuaryContainer';
import Sidebar from './components/Sidebar/Sidebar';
import StoryWeaver from './components/Story/StoryWeaver';
import SkillsPanel from './components/Skills/SkillsPanel';

// Hooks
import { useSanctuary } from './hooks/useSanctuary';
import { useLocalStorage } from './hooks/useLocalStorage';

// Utils
import { generateSessionId } from './utils/helpers';

// Lazy load heavy components
const Sanctuary3D = React.lazy(() => import('./components/Sanctuary/Sanctuary3D'));

function App() {
  const [sessionId, setSessionId] = useLocalStorage('havenmind-session', null);
  const [activeView, setActiveView] = useState('sanctuary'); // sanctuary, story, skills
  const [is3DMode, setIs3DMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      toast.success('Welcome to HavenMind! Your sanctuary awaits.');
    }

    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId, setSessionId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveView('sanctuary');
            break;
          case '2':
            e.preventDefault();
            setActiveView('story');
            break;
          case '3':
            e.preventDefault();
            setActiveView('skills');
            break;
          case 'd':
            e.preventDefault();
            if (activeView === 'sanctuary') {
              setIs3DMode(!is3DMode);
              toast.success(is3DMode ? 'Switched to 2D view' : 'Switched to 3D view');
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, is3DMode]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!sessionId) {
    return (
      <div className="app-error">
        <h1>Unable to Initialize Session</h1>
        <p>HavenMind couldn't create your personal session. Please refresh the page.</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }

  return (
    <SanctuaryProvider sessionId={sessionId}>
      <StoryProvider sessionId={sessionId}>
        <SkillsProvider sessionId={sessionId}>
          <Router>
            <div className="app">
              <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Sidebar */}
                <aside className="app-sidebar">
                  <Sidebar
                    sessionId={sessionId}
                    activeView={activeView}
                    onViewChange={setActiveView}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    is3DMode={is3DMode}
                    onToggle3D={() => setIs3DMode(!is3DMode)}
                  />
                </aside>

                {/* Main Content */}
                <main className="app-main">
                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route path="/" element={<Navigate to="/sanctuary" replace />} />
                      
                      <Route 
                        path="/sanctuary" 
                        element={
                          <motion.div
                            key="sanctuary"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="view-container"
                          >
                            <ErrorBoundary>
                              {is3DMode ? (
                                <Suspense fallback={<LoadingScreen message="Loading 3D Sanctuary..." />}>
                                  <Sanctuary3D sessionId={sessionId} />
                                </Suspense>
                              ) : (
                                <SanctuaryContainer sessionId={sessionId} />
                              )}
                            </ErrorBoundary>
                          </motion.div>
                        } 
                      />
                      
                      <Route 
                        path="/story" 
                        element={
                          <motion.div
                            key="story"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="view-container"
                          >
                            <ErrorBoundary>
                              <StoryWeaver sessionId={sessionId} />
                            </ErrorBoundary>
                          </motion.div>
                        } 
                      />
                      
                      <Route 
                        path="/skills" 
                        element={
                          <motion.div
                            key="skills"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="view-container"
                          >
                            <ErrorBoundary>
                              <SkillsPanel sessionId={sessionId} />
                            </ErrorBoundary>
                          </motion.div>
                        } 
                      />
                    </Routes>
                  </AnimatePresence>
                </main>
              </div>

              {/* Mobile Navigation */}
              {window.innerWidth < 768 && (
                <nav className="mobile-nav">
                  <button 
                    className={`nav-item ${activeView === 'sanctuary' ? 'active' : ''}`}
                    onClick={() => setActiveView('sanctuary')}
                  >
                    <span>Sanctuary</span>
                  </button>
                  <button 
                    className={`nav-item ${activeView === 'story' ? 'active' : ''}`}
                    onClick={() => setActiveView('story')}
                  >
                    <span>Stories</span>
                  </button>
                  <button 
                    className={`nav-item ${activeView === 'skills' ? 'active' : ''}`}
                    onClick={() => setActiveView('skills')}
                  >
                    <span>Skills</span>
                  </button>
                </nav>
              )}

              {/* Keyboard Shortcuts Help */}
              <div className="keyboard-shortcuts no-print">
                <details>
                  <summary>Keyboard Shortcuts</summary>
                  <div className="shortcuts-list">
                    <div><kbd>⌘/Ctrl + 1</kbd> Sanctuary</div>
                    <div><kbd>⌘/Ctrl + 2</kbd> Stories</div>
                    <div><kbd>⌘/Ctrl + 3</kbd> Skills</div>
                    <div><kbd>⌘/Ctrl + D</kbd> Toggle 3D</div>
                  </div>
                </details>
              </div>
            </div>
          </Router>
        </SkillsProvider>
      </StoryProvider>
    </SanctuaryProvider>
  );
}

// Performance monitoring wrapper
function AppWithPerformanceMonitoring() {
  useEffect(() => {
    // Log app startup time
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      if (process.env.REACT_APP_SHOW_PERFORMANCE_METRICS === 'true') {
        console.log(`App loaded in ${loadTime.toFixed(2)}ms`);
      }
    };
  }, []);

  return <App />;
}

export default process.env.REACT_APP_SHOW_PERFORMANCE_METRICS === 'true' 
  ? AppWithPerformanceMonitoring 
  : App;