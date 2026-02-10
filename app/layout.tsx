import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Active Guidance OS",
  description: "1日1提案で実行力を上げるDesktop-first習慣OS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className="mx-auto min-h-screen max-w-5xl px-6 py-8">
          <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-semibold">Active Guidance OS</h1>
              <p className="text-sm text-slate-600">実行力レベルを上げるミニマルOS</p>
            </div>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/history" className="hover:underline">
                History
              </Link>
              <Link href="/settings" className="hover:underline">
                Settings
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
