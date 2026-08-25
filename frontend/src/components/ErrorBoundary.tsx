import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_ROUTES } from '../constants';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log to frontend error logging service if configured
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = APP_ROUTES.HOME;
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200/80 dark:border-rose-900/40 p-8 text-center animate-fade-in">
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-5 ring-4 ring-rose-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              An unexpected error occurred while rendering this view. You can try refreshing the view or return to the home page.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                Return to Home
              </button>
            </div>

            {/* Collapsible Error Details for debugging */}
            {this.state.error && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-left">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <span>Technical Diagnostics</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3.5 bg-slate-950 text-slate-200 rounded-xl text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap leading-relaxed shadow-inner">
                    <p className="text-rose-400 font-bold mb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <p className="text-slate-400 text-[11px]">
                        {this.state.errorInfo.componentStack}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
