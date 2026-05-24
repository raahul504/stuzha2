import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dcs-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-dcs-dark-gray rounded-lg p-8 text-center">
            <h1 className="text-2xl text-dcs-purple mb-4">Something went wrong</h1>
            <p className="text-dcs-text-gray mb-6">
              The application encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-dcs-text-gray cursor-pointer hover:text-white">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-400 overflow-auto">
                  {this.state.error.toString()}
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

export default ErrorBoundary;
