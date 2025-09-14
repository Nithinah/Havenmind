import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'react-hot-toast';

// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Error boundary for the entire app
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global error caught:', error, errorInfo);
    
    // Log to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      // Analytics logging would go here
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
              Oops! Something went wrong
            </h1>
            <p style={{ marginBottom: '30px', opacity: '0.9', lineHeight: '1.6' }}>
              HavenMind encountered an unexpected error. Don't worry - your progress is safe.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'white',
                color: '#667eea',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              Refresh HavenMind
            </button>
            {process.env.REACT_APP_DEBUG_MODE === 'true' && (
              <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                  Technical Details
                </summary>
                <pre style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '10px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance reporting function
function reportWebVitals(metric) {
  // Only report in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Web Vital:', metric);
    // Send to analytics service
  }
}

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
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
    </GlobalErrorBoundary>
  </React.StrictMode>
);

// Report web vitals for performance monitoring
if (process.env.REACT_APP_SHOW_PERFORMANCE_METRICS === 'true') {
  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getFCP(reportWebVitals);
  getLCP(reportWebVitals);
  getTTFB(reportWebVitals);
}