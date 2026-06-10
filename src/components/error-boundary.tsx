"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="flex h-full min-h-screen w-full items-center justify-center bg-background p-6 text-foreground"
      >
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try reloading the page.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm
                       font-medium shadow-sm transition-colors hover:bg-accent
                       hover:text-accent-foreground focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
