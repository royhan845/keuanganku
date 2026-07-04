import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KeuanganKu",
  description: "Kelola keuangan Anda dengan aman",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // SuppressHydrationWarning diperlukan oleh next-themes di tag html
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-300`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}