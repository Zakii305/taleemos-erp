import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error in module:', this.props.moduleName, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-8 my-6 bg-red-950/20 border-2 border-red-500/80 rounded-[24px] shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/30 shrink-0">
              <AlertOctagon className="w-8 h-8 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-red-500 text-white rounded-full">
                  Red Error Boundary Intercept
                </span>
                <span className="text-xs text-red-400 font-mono">
                  {this.props.moduleName || 'ERP Module'}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-red-500">
                Module Encountered an Execution Anomaly
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                The global application state has been preserved. You can safely retry or switch to another module.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-black/50 rounded-xl border border-red-900/40 text-xs font-mono text-red-300 overflow-x-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-black tracking-wide rounded-full shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Module
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-full border border-slate-700 transition-all cursor-pointer"
                >
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
