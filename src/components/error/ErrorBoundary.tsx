import { Component, ErrorInfo, ReactNode } from "react";
import FallbackError from "./FallbackError";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <FallbackError
            error={this.state.error}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
