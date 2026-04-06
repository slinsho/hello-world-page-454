import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { canUseServiceWorkerRuntime } from "@/lib/pwa";

const CHECK_INTERVAL_MS = 15 * 1000;
const UPDATE_ANIMATION_MS = 2200;
const CONTROLLER_CHANGE_TIMEOUT_MS = 3000;

const extractBuildFingerprint = (html: string) => {
  const scriptMatch = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']*\/assets\/index-[^"']+\.js)["']/i);
  return scriptMatch?.[1] ?? null;
};

const normalizeFingerprint = (value: string | null) => {
  if (!value) return null;

  try {
    return new URL(value, window.location.origin).pathname;
  } catch {
    return value;
  }
};

const getCurrentBuildFingerprint = () => {
  const scriptSource = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]')?.src;
  return normalizeFingerprint(scriptSource ?? null);
};

const PWAUpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const latestBuildFingerprintRef = useRef<string | null>(null);
  const currentBuildFingerprintRef = useRef<string | null>(null);
  const progressFrameRef = useRef<number | null>(null);
  const updatingRef = useRef(false);
  const controllerChangedRef = useRef(false);

  const syncWaitingWorker = useCallback((registration?: ServiceWorkerRegistration | null, candidate?: ServiceWorker | null) => {
    const waitingWorker = candidate ?? registration?.waiting ?? null;
    waitingWorkerRef.current = waitingWorker;

    if (waitingWorker) {
      setShowPrompt(true);
    }
  }, []);

  const checkPublishedBuild = useCallback(async () => {
    if (!canUseServiceWorkerRuntime()) return false;

    currentBuildFingerprintRef.current ??= getCurrentBuildFingerprint();

    try {
      const response = await fetch(`/index.html?__pwa_update_check=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
      });

      if (!response.ok) return false;

      const latestFingerprint = normalizeFingerprint(extractBuildFingerprint(await response.text()));
      latestBuildFingerprintRef.current = latestFingerprint;

      if (
        latestFingerprint &&
        currentBuildFingerprintRef.current &&
        latestFingerprint !== currentBuildFingerprintRef.current
      ) {
        setShowPrompt(true);
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }, []);

  const forceRefreshToLatestBuild = useCallback(async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    } catch {
      // Ignore unregister failures and continue with the hard refresh.
    }

    if ("caches" in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.allSettled(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      } catch {
        // Ignore cache deletion failures and continue with the reload.
      }
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("pwa-updated", Date.now().toString());
    window.location.replace(nextUrl.toString());
  }, []);

  const animateProgressToCompletion = useCallback(() => {
    if (progressFrameRef.current) {
      window.cancelAnimationFrame(progressFrameRef.current);
    }

    return new Promise<void>((resolve) => {
      const startTime = performance.now();

      const step = (timestamp: number) => {
        const nextProgress = Math.min(((timestamp - startTime) / UPDATE_ANIMATION_MS) * 100, 100);
        setProgress(nextProgress);

        if (nextProgress < 100) {
          progressFrameRef.current = window.requestAnimationFrame(step);
          return;
        }

        progressFrameRef.current = null;
        resolve();
      };

      progressFrameRef.current = window.requestAnimationFrame(step);
    });
  }, []);

  const runUpdateCheck = useCallback(async () => {
    if (!canUseServiceWorkerRuntime()) return;

    const registration = registrationRef.current ?? (await navigator.serviceWorker.getRegistration());
    if (registration) {
      registrationRef.current = registration;
      syncWaitingWorker(registration);
      await registration.update().catch(() => undefined);
      syncWaitingWorker(registration);
    }

    await checkPublishedBuild();
  }, [checkPublishedBuild, syncWaitingWorker]);

  useEffect(() => {
    if (!canUseServiceWorkerRuntime()) return;

    currentBuildFingerprintRef.current = getCurrentBuildFingerprint();

    let isActive = true;
    let intervalId: number | null = null;
    let activeRegistration: ServiceWorkerRegistration | null = null;

    const handleInstallingWorker = (
      worker: ServiceWorker,
      registration: ServiceWorkerRegistration,
    ) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          syncWaitingWorker(registration, registration.waiting ?? worker);
        }
      });
    };

    const handleUpdateFound = () => {
      const installingWorker = activeRegistration?.installing;
      if (activeRegistration && installingWorker) {
        handleInstallingWorker(installingWorker, activeRegistration);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void runUpdateCheck();
      }
    };

    const handleFocus = () => {
      void runUpdateCheck();
    };

    const handleOnline = () => {
      void runUpdateCheck();
    };

    const handleControllerChange = () => {
      if (updatingRef.current && !controllerChangedRef.current) {
        controllerChangedRef.current = true;
        window.location.reload();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    void navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then(async (registration) => {
        if (!isActive) return;

        activeRegistration = registration;
        registrationRef.current = registration;
        syncWaitingWorker(registration);

        if (registration.installing) {
          handleInstallingWorker(registration.installing, registration);
        }

        registration.addEventListener("updatefound", handleUpdateFound);
        await runUpdateCheck();
        intervalId = window.setInterval(() => void runUpdateCheck(), CHECK_INTERVAL_MS);
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
      if (progressFrameRef.current) {
        window.cancelAnimationFrame(progressFrameRef.current);
      }
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      activeRegistration?.removeEventListener("updatefound", handleUpdateFound);
    };
  }, [runUpdateCheck, syncWaitingWorker]);

  const applyAvailableUpdate = useCallback(async () => {
    const registration = registrationRef.current ?? (await navigator.serviceWorker.getRegistration());

    if (!registration) {
      await forceRefreshToLatestBuild();
      return;
    }

    registrationRef.current = registration;
    await registration.update().catch(() => undefined);

    const waitingWorker = registration.waiting ?? waitingWorkerRef.current;
    if (waitingWorker) {
      waitingWorkerRef.current = waitingWorker;

      await new Promise<void>((resolve) => {
        const timeoutId = window.setTimeout(resolve, CONTROLLER_CHANGE_TIMEOUT_MS);

        const handleControllerChange = () => {
          window.clearTimeout(timeoutId);
          navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
          resolve();
        };

        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange, { once: true });
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
      });

      if (!controllerChangedRef.current) {
        window.location.reload();
      }
      return;
    }

    if (
      latestBuildFingerprintRef.current &&
      currentBuildFingerprintRef.current &&
      latestBuildFingerprintRef.current !== currentBuildFingerprintRef.current
    ) {
      await forceRefreshToLatestBuild();
      return;
    }

    window.location.reload();
  }, [forceRefreshToLatestBuild]);

  const handleUpdate = useCallback(async () => {
    if (updatingRef.current) return;

    updatingRef.current = true;
    controllerChangedRef.current = false;
    setUpdating(true);
    setProgress(0);

    try {
      await Promise.all([runUpdateCheck(), animateProgressToCompletion()]);
      await applyAvailableUpdate();
    } catch {
      await forceRefreshToLatestBuild();
    }
  }, [animateProgressToCompletion, applyAvailableUpdate, forceRefreshToLatestBuild, runUpdateCheck]);

  if (!showPrompt) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-background/60 backdrop-blur-sm transition-all duration-300"
        aria-hidden="true"
      />

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
                  {progress < 100 ? "Updating…" : "Opening the latest version…"}
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
