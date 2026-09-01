import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { ClientAuthProvider } from "@/components/providers/ClientAuthProvider";

const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-app-sans",
  display: "swap",
});

const fontDisplay = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-app-display",
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-app-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RBOE - Your MS Dream, Our Mission",
  description: "Transform your graduate school aspirations into reality with expert guidance, AI-powered document crafting, and personalized application strategies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientAuthProvider>{children}</ClientAuthProvider>
      </body>
    </html>
  );
}
