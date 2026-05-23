import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Global Error]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-destructive" size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Ops! Qualcosa è andato storto</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            L'applicazione ha riscontrato un errore inaspettato.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
          >
            <RefreshCcw size={18} />
            Ricarica app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
