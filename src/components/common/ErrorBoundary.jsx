import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('IEI DASHBOARD SYSTEM Error Caught by Boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetToHome = () => {
    try {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch {
      window.location.reload();
    }
  };

  handleClearCache = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('iei_')) {
            localStorage.removeItem(key);
          }
        });
      }
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-slate-950">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
            {/* Top gold ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              IEI DASHBOARD SYSTEM • System Notice
            </span>

            <h1 className="text-2xl font-black text-white mt-4 tracking-tight">
              Portal Recovery Mode
            </h1>

            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              The portal encountered an unexpected display issue. Your saved committee records and sessions remain safe. Please refresh or return to the public welcome page.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-102 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetToHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Public Homepage</span>
              </button>
            </div>

            <button
              onClick={this.handleClearCache}
              className="mt-6 text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-4 cursor-pointer"
            >
              Clear Temporary Cache &amp; Reload Fresh
            </button>

            {this.state.error && (
              <details className="mt-6 text-left bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 overflow-x-auto">
                <summary className="cursor-pointer text-slate-500 font-mono">
                  Technical Diagnostics (Click to view)
                </summary>
                <p className="mt-2 text-rose-400 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
