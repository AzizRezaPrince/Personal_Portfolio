import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PortfolioProvider } from "./context/PortfolioContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aziz Reza Prince | Portfolio",
  description: "UI/UX Designer & Android App Developer Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <PortfolioProvider>
          {children}
        </PortfolioProvider>
      </body>
    </html>
  );
}
