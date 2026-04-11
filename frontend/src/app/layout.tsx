import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Providers from "@/components/providers/Providers";

const appSans = Plus_Jakarta_Sans({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const appMono = JetBrains_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "PurrfectCare",
  title: "PurrfectCare - Pet Care Made Easy",
  description: "Your trusted companion for pet care management",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PurrfectCare",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${appSans.variable} ${appMono.variable} antialiased`}
      >
        <Script id="strip-bis-attributes" strategy="beforeInteractive">
          {`(function () {
  var attrs = ["bis_skin_checked", "bis_register", "bis_size"];

  function stripFromElement(el) {
    if (!el || el.nodeType !== 1) return;
    for (var i = 0; i < attrs.length; i++) {
      if (el.hasAttribute(attrs[i])) {
        el.removeAttribute(attrs[i]);
      }
    }
  }

  function stripFromTree(root) {
    if (!root || !root.querySelectorAll) return;
    stripFromElement(root);
    for (var i = 0; i < attrs.length; i++) {
      var nodes = root.querySelectorAll("[" + attrs[i] + "]");
      for (var j = 0; j < nodes.length; j++) {
        nodes[j].removeAttribute(attrs[i]);
      }
    }
  }

  stripFromTree(document.documentElement);

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      if (mutation.type === "attributes") {
        stripFromElement(mutation.target);
      }

      if (mutation.type === "childList") {
        for (var j = 0; j < mutation.addedNodes.length; j++) {
          var node = mutation.addedNodes[j];
          stripFromTree(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: attrs,
  });
})();`}
        </Script>
        <Providers>
          <Toaster
            position="top-center"
            gutter={10}
            containerStyle={{
              top: 14,
              left: 12,
              right: 12,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#363636",
                padding: "16px",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "420px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              },
              success: {
                iconTheme: {
                  primary: "#10B981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#fff",
                },
              },
            }}
          />
          <div suppressHydrationWarning>{children}</div>
        </Providers>
      </body>
    </html>
  );
}
