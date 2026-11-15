import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AURA App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md">
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              A temporary issue occurred while rendering. Click below to reload the platform.
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
