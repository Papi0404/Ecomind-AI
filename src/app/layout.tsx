import type { Metadata } from "next";
import "./globals.css";
import QueryClientProvider from "@/providers/QueryClientProvider";
import NotificationToast from "@/components/NotificationToast";

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
        {/* Google Fonts — loaded via link to avoid PostCSS @import conflict */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
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
          {/* Global real-time notification toasts — polls every 15s for new notifs */}
          <NotificationToast />
        </QueryClientProvider>
      </body>
    </html>
  );
}
