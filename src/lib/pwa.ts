type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export const isPreviewHost = (hostname = window.location.hostname) =>
  hostname.includes("id-preview--") || hostname.includes("lovable.app") || hostname.includes("lovableproject.com");

export const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export const isStandalonePwa = () => {
  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone)
  );
};

export const isInstalledMobilePwa = () => {
  if (typeof window === "undefined") return false;
  return isStandalonePwa() && window.matchMedia("(max-width: 767px)").matches;
};

export const canUseServiceWorkerRuntime = () => {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && !isInIframe() && !isPreviewHost();
};