import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mluvící karty",
  description: "Aplikace Mluvící karty",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
