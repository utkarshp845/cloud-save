import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";

import "./globals.css";
import { Header } from "@/components/layout/Header";
import { AmplifyProvider } from "@/components/providers/AmplifyProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpotSave - AWS Cost Optimization",
  description: "Optimize your AWS costs with intelligent insights and recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AmplifyProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            {children}
          </ThemeProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}

