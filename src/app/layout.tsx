import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { NotificationProvider } from "@/components/NotificationProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coaching App",
  description: "Connect with your assigned partner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ChatProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
