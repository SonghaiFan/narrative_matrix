import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { CenterControlProvider } from "@/contexts/center-control-context";
import { TooltipProvider } from "@/contexts/tooltip-context";
import { DisableContextMenu } from "@/components/features/narrative/shared/disable-context-menu";
import { DisableSearch } from "@/components/features/narrative/shared/disable-search";
import { Toaster } from "sonner";
// import { ClarityAnalytics } from "@/components/analytics/ClarityAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Narrative Matrix",
  description: "Interactive visualization of narrative data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CenterControlProvider>
            <TooltipProvider>
              {/* <DisableContextMenu /> */}
              <DisableSearch />
              <Toaster position="top-center" richColors />
              {/* <ClarityAnalytics /> */}
              {children}
            </TooltipProvider>
          </CenterControlProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
