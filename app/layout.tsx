// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider"; 

export const metadata: Metadata = {
  title: "Manee AI",
  description: "Your intelligent companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#131314]">
        <AuthProvider> 
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}