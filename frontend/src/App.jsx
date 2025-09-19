import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
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
import { useLocalStorage } from './hooks/useLocalStorage';

// Utils
import { generateSessionId } from './utils/helpers';

// Lazy load heavy components
const Sanctuary3D = React.lazy(() => import('./components/Sanctuary/Sanctuary3D'));

// Main App Content Component
function AppContent() {
  const location = useLocation();
  const [sessionId, setSessionId] = useLocalStorage('havenmind-session', null);
  const [activeView, setActiveView] = useState('sanctuary');
  const [is3DMode, setIs3DMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isDragging, setIsDragging] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const appLayoutRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(380);

  // Update active view based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/sanctuary')) {
      setActiveView('sanctuary');
    } else if (path.startsWith('/story')) {
      setActiveView('story');
    } else if (path.startsWith('/skills')) {
      setActiveView('skills');
    }
  }, [location]);

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      toast.success('Welcome to HavenMind! Your sanctuary awaits.');
    }
  }, [sessionId, setSessionId]);

  // Handle sidebar dragging
  const handleMouseDown = useCallback((e) => {
    if (sidebarCollapsed) return;
    
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.min(Math.max(startWidthRef.current + deltaX, 280), 600);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarCollapsed, sidebarWidth]);

  // Handle keyboard shortcuts with proper dependencies
  const handleKeyDown = useCallback((e) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          window.location.hash = '#/sanctuary';
          break;
        case '2':
          e.preventDefault();
          window.location.hash = '#/story';
          break;
        case '3':
          e.preventDefault();
          window.location.hash = '#/skills';
          break;
        case 'd':
          e.preventDefault();
          if (activeView === 'sanctuary') {
            setIs3DMode(prev => !prev);
            toast.success(is3DMode ? 'Switched to 2D view' : 'Switched to 3D view');
          }
          break;
        default:
          break;
      }
    }
  }, [activeView, is3DMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!sessionId) {
    return <LoadingScreen message="Initializing your sanctuary..." />;
  }

  return (
    <SanctuaryProvider sessionId={sessionId}>
      <StoryProvider sessionId={sessionId}>
        <SkillsProvider sessionId={sessionId}>
          <div className={`app${darkMode ? ' dark-mode' : ''}`}>
            <div 
              ref={appLayoutRef}
              className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDragging ? 'sidebar-dragging' : ''}`}
            >
              {/* Sidebar */}
              <aside 
                className="app-sidebar"
                style={{ 
                  width: sidebarCollapsed ? '80px' : `${sidebarWidth}px`,
                  transition: isDragging ? 'none' : 'all 0.3s ease'
                }}
              >
                <Sidebar
                  sessionId={sessionId}
                  activeView={activeView}
                  onViewChange={setActiveView}
                  collapsed={sidebarCollapsed}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                  is3DMode={is3DMode}
                  onToggle3D={() => setIs3DMode(!is3DMode)}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode((prev) => !prev)}
                />
                {/* Drag Handle */}
                {!sidebarCollapsed && (
                  <div
                    className="sidebar-drag-handle"
                    onMouseDown={handleMouseDown}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.5)' : 'transparent',
                      transition: 'background-color 0.2s ease',
                      zIndex: 1001
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: '-2px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '8px',
                        height: '40px',
                        backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        opacity: isDragging ? '1' : '0',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </div>
                )}
              </aside>
              {/* Main Content */}
              <main 
                className="app-main"
              >
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
                  onClick={() => window.location.hash = '#/sanctuary'}
                >
                  <span>Sanctuary</span>
                </button>
                <button 
                  className={`nav-item ${activeView === 'story' ? 'active' : ''}`}
                  onClick={() => window.location.hash = '#/story'}
                >
                  <span>Stories</span>
                </button>
                <button 
                  className={`nav-item ${activeView === 'skills' ? 'active' : ''}`}
                  onClick={() => window.location.hash = '#/skills'}
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
        </SkillsProvider>
      </StoryProvider>
    </SanctuaryProvider>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '400px'
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#6366f1',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;