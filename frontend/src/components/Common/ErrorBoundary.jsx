import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you would send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const { fallback: CustomFallback } = this.props;

      // If custom fallback is provided, use it
      if (CustomFallback) {
        return (
          <CustomFallback 
            error={error}
            errorInfo={errorInfo}
            onRetry={this.handleRetry}
            retryCount={retryCount}
          />
        );
      }

      return (
        <div className="error-boundary">
          <motion.div 
            className="error-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="error-icon">
              <AlertTriangle size={48} />
            </div>
            
            <h2 className="error-title">Something went wrong</h2>
            
            <p className="error-description">
              We encountered an unexpected error. Your sanctuary data is safe, 
              and this is likely a temporary issue.
            </p>

            <div className="error-actions">
              <motion.button
                className="retry-button"
                onClick={this.handleRetry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={retryCount >= 3}
              >
                <RefreshCw size={16} />
                {retryCount >= 3 ? 'Max retries reached' : `Retry${retryCount > 0 ? ` (${retryCount})` : ''}`}
              </motion.button>
              
              <motion.button
                className="home-button"
                onClick={this.handleGoHome}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home size={16} />
                Go to Sanctuary
              </motion.button>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="error-details">
                <summary>Technical Details (Development Mode)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{error.toString()}</pre>
                  
                  {errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{errorInfo.componentStack}</pre>
                    </>
                  )}
                  
                  {error.stack && (
                    <>
                      <h4>Error Stack:</h4>
                      <pre>{error.stack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-help">
              <p>If this problem persists:</p>
              <ul>
                <li>Try refreshing your browser</li>
                <li>Clear your browser cache</li>
                <li>Check your internet connection</li>
                <li>Contact support if the issue continues</li>
              </ul>
            </div>
          </motion.div>

          {/* Background decoration */}
          <div className="error-background">
            <div className="bg-circle bg-circle-1" />
            <div className="bg-circle bg-circle-2" />
            <div className="bg-circle bg-circle-3" />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;