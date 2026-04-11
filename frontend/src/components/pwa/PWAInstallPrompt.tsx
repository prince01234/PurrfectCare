"use client";

import { useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari legacy standalone flag
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
    )
  );
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const shouldShow = useMemo(() => {
    return !isInstalled && !isDismissed && Boolean(deferredPrompt);
  }, [deferredPrompt, isDismissed, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-120 rounded-2xl border border-teal-100 bg-white p-3 shadow-[0_16px_50px_rgba(15,23,42,0.2)] sm:bottom-6 sm:left-auto sm:right-6 sm:w-90">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Install PurrfectCare
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Add this app to your home screen for faster access and app-like use.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
          aria-label="Dismiss install prompt"
        >
          Not now
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          void handleInstallClick();
        }}
        className="mt-3 w-full rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        Install App
      </button>
    </div>
  );
}
