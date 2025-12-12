import React, { ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component to catch rendering errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h1>
            <div className="bg-red-50 p-4 rounded text-left mb-6 overflow-auto max-h-40">
                <p className="text-red-800 text-xs font-mono break-all">{this.state.error?.message}</p>
            </div>
            <button 
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }} 
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-bold"
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);