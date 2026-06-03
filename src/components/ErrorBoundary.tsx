/**
 * ============================================================
 *  ErrorBoundary  —  the safety net for crashes
 * ============================================================
 *  React's rule: if ANY component throws an error during render,
 *  the whole app turns into a blank white screen — unless an
 *  ErrorBoundary above it catches the error.
 *
 *  This component wraps the entire app (see App.tsx) so the
 *  user always sees a friendly "Something went wrong" page with
 *  a "Refresh" / "Go Home" button instead of a blank screen.
 *
 *  DEBUG TIP: every caught error is also written to the
 *  Debug Panel (open with Ctrl+Shift+D) so you can copy the
 *  full stack trace for a developer.
 * ============================================================
 */
import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { log } from "@/lib/debug";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  // Called by React when a child component throws.
  // We use it to update the UI to the fallback below.
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Also called by React — gives us the error + component stack.
  // We forward it to console AND the Debug Panel.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    log.error(`Render crash: ${error.message}`, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Something went wrong</h1>
              <p className="text-muted-foreground text-sm">
                An unexpected error occurred. Please try refreshing the page.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-xs text-muted-foreground bg-muted p-3 rounded-xl overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()} className="gap-2 rounded-xl">
                <RefreshCw className="h-4 w-4" /> Refresh Page
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/"} className="gap-2 rounded-xl">
                <Home className="h-4 w-4" /> Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
