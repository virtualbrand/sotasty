import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";

const kumbhSans = localFont({
  src: [
    {
      path: '../public/fonts/KumbhSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/KumbhSans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-kumbh-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "CakeCloud - Sistema de Gestão para Confeitaria",
  description: "Sistema completo para gerenciar sua confeitaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${kumbhSans.variable} font-sans antialiased`}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
