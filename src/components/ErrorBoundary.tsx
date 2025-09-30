import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimer?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualiza o state para mostrar a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Detectar se é erro específico do Safari/iPhone
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isRouterError = error.message.includes('router') || 
                         error.stack?.includes('react-router') ||
                         errorInfo.componentStack.includes('Router') ||
                         errorInfo.componentStack.includes('Routes');

    // Para erros menores ou de carregamento, tentar recuperação automática
    const isMinorError = error.message.includes('Loading chunk') ||
                        error.message.includes('ChunkLoadError') ||
                        error.message.includes('Loading CSS chunk') ||
                        error.name === 'ChunkLoadError';

    if (isMinorError && this.state.retryCount < 2) {
      // Tentar recuperação automática após 1 segundo
      this.retryTimer = setTimeout(() => {
        this.setState(prevState => ({ 
          hasError: false, 
          error: undefined, 
          errorInfo: undefined,
          retryCount: prevState.retryCount + 1
        }));
      }, 1000);
      return;
    }

    // Log apenas para erros críticos
    if (!isMinorError) {
      console.error('🔍 Erro capturado:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        isSafari,
        isIOS,
        isRouterError
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      // UI de fallback customizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              Ops! Algo deu errado
            </h1>
            
            <p className="text-gray-600 mb-4">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <strong>Erro:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Recarregar página
              </button>
              
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined, retryCount: 0 });
                }}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;