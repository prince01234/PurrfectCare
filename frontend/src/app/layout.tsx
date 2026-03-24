import type { Metadata } from "next";
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
  title: "PurrfectCare - Pet Care Made Easy",
  description: "Your trusted companion for pet care management",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${appSans.variable} ${appMono.variable} antialiased`}
      >
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
