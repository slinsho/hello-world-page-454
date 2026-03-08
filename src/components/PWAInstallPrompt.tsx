import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed recently (24h cooldown)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return;

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOSDevice && !("standalone" in navigator && (navigator as any).standalone)) {
      setIsIOS(true);
      // Show after 5 seconds of browsing
      const timer = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 5 seconds
      setTimeout(() => setShowBanner(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-6 md:max-w-sm">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-lg flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Install L-Prop</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap <span className="font-medium">Share</span> then{" "}
              <span className="font-medium">"Add to Home Screen"</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to your home screen for the best experience
            </p>
          )}
          {!isIOS && (
            <Button
              size="sm"
              onClick={handleInstall}
              className="mt-2 h-8 text-xs rounded-lg"
            >
              Install Now
            </Button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
