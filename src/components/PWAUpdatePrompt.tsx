import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const PWAUpdatePrompt = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      // New SW activated — reload
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker.ready.then((registration) => {
      // Check if a waiting worker already exists
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowPrompt(true);
      }

      // Listen for new service workers
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowPrompt(true);
          }
        });
      });
    });

    // Periodically check for updates (every 60s)
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then((reg) => reg.update().catch(() => {}));
    }, 60000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const handleUpdate = useCallback(() => {
    if (!waitingWorker) return;
    setUpdating(true);
    setProgress(0);

    // Animate progress bar over ~2s, then tell SW to skip waiting
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current >= 95) {
        current = 95;
        clearInterval(interval);
        // Tell the waiting SW to activate
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
        // controllerchange listener will trigger reload
        // Fallback: force reload after 3s if controllerchange doesn't fire
        setTimeout(() => {
          setProgress(100);
          setTimeout(() => window.location.reload(), 400);
        }, 3000);
      }
      setProgress(Math.min(current, 100));
    }, 120);
  }, [waitingWorker]);

  if (!showPrompt) return null;

  return (
    <>
      {/* Blur overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-all duration-300"
        aria-hidden="true"
      />

      {/* Bottom update panel */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-500">
        <div className="mx-auto max-w-lg px-4 pb-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <RefreshCw className={`w-5 h-5 text-primary ${updating ? "animate-spin" : ""}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Update Available</p>
                <p className="text-xs text-muted-foreground">
                  A new version of L-Prop is ready
                </p>
              </div>
            </div>

            {updating ? (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {progress < 95 ? "Updating…" : "Almost done…"}
                </p>
              </div>
            ) : (
              <Button
                onClick={handleUpdate}
                className="w-full h-11 rounded-xl text-sm font-semibold shadow-lg"
              >
                Update Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PWAUpdatePrompt;
