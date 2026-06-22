import type { Metadata } from "next";
import "./globals.css";
import QueryClientProvider from "@/providers/QueryClientProvider";

export const metadata: Metadata = {
  title: "EcoMind AI - Platform AI Lingkungan Hidup Premium",
  description: "Asisten AI pintar untuk gaya hidup ramah lingkungan, kalkulator jejak karbon, tantangan hijau gamifikasi, dan aksi pelestarian bumi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('ecomind-theme') || 'light';
                document.documentElement.setAttribute('data-theme', savedTheme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <QueryClientProvider>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
