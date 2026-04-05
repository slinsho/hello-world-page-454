import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { registerSW } from "virtual:pwa-register";

const PWAUpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    // registerSW with prompt mode — it returns a function to call when the user accepts
    const update = registerSW({
      onNeedRefresh() {
        setShowPrompt(true);
      },
      onOfflineReady() {
        // App is ready for offline use — no action needed
      },
    });

    setUpdateSW(() => update);
  }, []);

  const handleUpdate = useCallback(() => {
    if (!updateSW) return;
    setUpdating(true);
    setProgress(0);

    // Animate progress bar, then trigger the actual update
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current >= 95) {
        current = 95;
        clearInterval(interval);
        // Trigger the service worker update + reload
        updateSW(true).catch(() => {
          // Fallback: force reload
          setTimeout(() => window.location.reload(), 500);
        });
        setTimeout(() => {
          setProgress(100);
          // Fallback reload if SW update didn't trigger page reload
          setTimeout(() => window.location.reload(), 400);
        }, 3000);
      }
      setProgress(Math.min(current, 100));
    }, 120);
  }, [updateSW]);

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
