import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoTasty - Login",
  description: "Acesse sua conta SoTasty",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
